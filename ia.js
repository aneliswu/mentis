// MENTIS — profesora IA con Gemini (la key se guarda solo en este dispositivo)
import { S, guardar } from './store.js';
import { GRADOS, normalizar, barajar } from './generadores.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
export const iaLista = () => !!S().ia?.key && navigator.onLine;

const NIVEL = g => `${GRADOS[g]} (${['', 'primaria terminada', 'secundaria', 'preparatoria', 'licenciatura', 'nivel de universidad de élite como Harvard'][g]})`;
const CONTEXTO = `Eres la profesora de MENTIS, una app de estudio personal. Hablas en español de México, natural, cálido y claro; nunca infantil.
Tu alumna quiere aprender cosas útiles para la vida diaria y para concursos de cultura general. Sé exacta: si no estás segura de un dato, no lo uses.`;

async function llamar(prompt, { json = true, temperatura = 0.7 } = {}) {
  const { key, modelo } = S().ia;
  if (!key) throw new Error('Primero conecta tu key de Gemini en Perfil → Ajustes.');
  if (!navigator.onLine) throw new Error('Necesitas internet para usar a la profesora IA.');
  let res, intento = 0;
  // Si Gemini está saturado (503/500), espera un poco y reintenta hasta 2 veces
  while (true) {
    try {
      res = await fetch(`${BASE}/models/${encodeURIComponent(modelo)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: CONTEXTO + '\n\n' + prompt }] }],
          generationConfig: { temperature: temperatura, ...(json ? { responseMimeType: 'application/json' } : {}) },
        }),
      });
    } catch { throw new Error('No se pudo conectar con Gemini. Revisa tu internet.'); }
    if ((res.status === 503 || res.status === 500) && intento < 2) { await new Promise(r => setTimeout(r, intento ? 5000 : 2000)); intento++; continue; }
    break;
  }
  if (!res.ok) {
    let msg = ''; try { msg = (await res.json()).error?.message || ''; } catch {}
    if (res.status === 429) throw new Error('Llegaste al límite gratis de Gemini por ahora. Intenta en unos minutos.');
    if (res.status === 503 || res.status === 500) throw new Error('Gemini está saturado en este momento (no es tu key). Suele pasar unos minutos.');
    if (res.status === 400 && /key/i.test(msg)) throw new Error('La key de Gemini no es válida. Revísala en Ajustes.');
    if (res.status === 404) throw new Error(`El modelo “${modelo}” no existe para tu key. Elige otro en Ajustes.`);
    throw new Error(`Gemini respondió con error ${res.status}. ${msg}`.trim());
  }
  const data = await res.json();
  const texto = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
  if (!json) return texto.trim();
  try { return JSON.parse(texto.replace(/^```(json)?|```$/g, '').trim()); }
  catch { throw new Error('La IA respondió en un formato inesperado. Intenta otra vez.'); }
}

export async function listarModelos(key) {
  const res = await fetch(`${BASE}/models?pageSize=200`, { headers: { 'x-goog-api-key': key } });
  if (!res.ok) throw new Error(res.status === 400 || res.status === 403 ? 'La key no es válida.' : `Error ${res.status}`);
  const d = await res.json();
  return (d.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name.replace('models/', '')).filter(n => /gemini/.test(n));
}

// Convierte preguntas de la IA al formato de MENTIS y las guarda para repasarlas después
function aPreguntas(lista, materia, extra = {}) {
  return (lista || []).filter(q => q && q.pregunta && Array.isArray(q.opciones) && q.opciones.length >= 3).map(q => {
    const idx = Math.min(Math.max(0, q.correcta | 0), q.opciones.length - 1);
    const p = { materia, id: `${materia === 'cul' ? 'cul' : materia}:ia:` + normalizar(q.pregunta).slice(0, 48), nombre: q.pregunta.slice(0, 60), enunciado: q.pregunta, tipo: 'opc', a: q.opciones[idx], opciones: barajar(q.opciones), explicacion: q.explicacion || '', ...extra };
    if (materia === 'cul') S().bancoIA[p.id] = p;
    return p;
  });
}

export async function leccionCultura(grado, categoria, evitar = []) {
  const d = await llamar(`Prepara una mini lección de ${categoria} para nivel ${NIVEL(grado)}.
Elige un tema útil para concursos de cultura general o para la vida diaria. No repitas estos temas: ${evitar.slice(-15).join('; ') || 'ninguno'}.
Responde SOLO con JSON con esta forma:
{"titulo": "...", "explicacion": "entre 80 y 140 palabras, clara y con un ejemplo", "dato_curioso": "una línea", "preguntas": [{"pregunta": "...", "opciones": ["...","...","...","..."], "correcta": 0, "explicacion": "una línea"}]}
Incluye exactamente 4 preguntas de opción múltiple sobre lo explicado. "correcta" es el índice (0–3) de la opción correcta.`);
  const preguntas = aPreguntas(d.preguntas, 'cul', { categoria });
  guardar();
  return { titulo: d.titulo, explicacion: d.explicacion, dato: d.dato_curioso, categoria, preguntas };
}

export async function explicar(p, respuesta) {
  return llamar(`Pregunta: ${p.enunciado}
Respuesta correcta: ${p.a}
La alumna respondió: ${respuesta || '(nada)'}
Explícale en máximo 90 palabras por qué la respuesta correcta es esa, con un truco para recordarlo.${p.materia === 'mat' ? ' Incluye cómo se lee en voz alta la expresión matemática.' : ''}`, { json: false });
}

export async function retroEscritura(texto, palabras) {
  return llamar(`La alumna escribió este texto usando las palabras ${palabras.map(p => `“${p}”`).join(', ')}:
"""${texto}"""
Responde SOLO con JSON: {"uso_correcto": {"palabra": true/false}, "comentario": "máximo 60 palabras, cálido y concreto", "correcciones": ["ortografía o redacción a corregir, si hay"]}`);
}

export async function examenLibro(titulo, autor, resumen = '') {
  const d = await llamar(resumen
    ? `La alumna leyó “${titulo}”${autor ? ' de ' + autor : ''}. Este es su resumen: """${resumen}"""
Hazle 5 preguntas de opción múltiple que comprueben si entendió las ideas principales, basadas en su resumen y, si conoces el libro, en el libro.
Responde SOLO con JSON: {"conoce": true, "preguntas": [{"pregunta": "...", "opciones": ["...","...","...","..."], "correcta": 0, "explicacion": "..."}]}`
    : `La alumna terminó de leer “${titulo}”${autor ? ' de ' + autor : ''}.
Si NO conoces este libro con seguridad, responde {"conoce": false, "preguntas": []}.
Si lo conoces bien, hazle 5 preguntas de opción múltiple sobre su trama o ideas principales (no detalles minúsculos), para comprobar que lo entendió.
Responde SOLO con JSON: {"conoce": true, "preguntas": [{"pregunta": "...", "opciones": ["...","...","...","..."], "correcta": 0, "explicacion": "..."}]}`, { temperatura: 0.4 });
  return { conoce: !!d.conoce, preguntas: aPreguntas(d.preguntas, 'lib') };
}
