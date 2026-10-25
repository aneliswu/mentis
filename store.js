// MENTIS — almacenamiento local (todo vive en este dispositivo)
const KEY = 'mentis:v1';

export const hoy = (d = new Date()) => {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
export const fechaDe = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const sumarDias = (s, n) => { const d = fechaDe(s); d.setDate(d.getDate() + n); return hoy(d); };
export const difDias = (a, b) => Math.round((fechaDe(b) - fechaDe(a)) / 86400000);

function estadoInicial() {
  return {
    v: 1,
    creado: hoy(),
    perfil: null,                // {nombre, metaMinutos, misionesPorDia, descanso:[0..6], metaSemanal}
    ajustes: { tema: 'sistema', mascota: true, nombres: { leylapi: 'Leylapi', kalipi: 'Kalipi' } },
    grados: { mat: 1, len: 1, geo: 1, cul: 1, log: 1 },
    clase: null,                 // {fecha, pasos:[...], idx, terminada, examen:{total,correctas}}
    escritos: [],                // {f, texto, palabras:[], completo}
    libros: [],                  // {id, titulo, autor, inicio, fin, estado, examen:{f, correctas, total}, comprendido}
    bancoIA: {},                 // preguntas generadas por la IA, para poder repasarlas
    examenesNivel: {},           // materia -> {f, correctas, aprobado, grado}
    ia: { key: '', modelo: 'gemini-3.6-flash' },
    xp: 0,
    dias: {},                    // 'YYYY-MM-DD' -> {xp, ejercicios, correctas, segundos, misiones:[ids]}
    intentos: [],                // {f, t, m, h, ok, s, r}  f=fecha t=timestamp m=materia h=habilidad ok s=segundos r=¿reintento tras error?
    conceptos: {},               // id -> {m, nombre, caja, prox, aciertos:[bool], diasAcierto:[], dominado:null|fecha, primeraVez}
    logros: {},                  // id -> fecha
    misiones: { fecha: null, lista: [] },
    eventos: [],                 // {f, tipo, texto}  para mascota / evolución
    ultimaVisita: null,
  };
}

let estado = cargar();
const oyentes = new Set();

function cargar() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrar(Object.assign(estadoInicial(), JSON.parse(raw)));
  } catch (e) { console.warn('No se pudo leer el progreso', e); }
  return estadoInicial();
}

// Versiones anteriores: 'calculo' pasa a ser parte de Matemáticas
function migrar(e) {
  const base = estadoInicial();
  e.grados = Object.assign(base.grados, e.grados || {});
  e.ia = Object.assign(base.ia, e.ia || {});
  e.ajustes = Object.assign(base.ajustes, e.ajustes || {});
  e.ajustes.nombres = Object.assign({ leylapi: 'Leylapi', kalipi: 'Kalipi' }, e.ajustes.nombres || {});
  delete e.ajustes.nombreMascota;
  e.intentos.forEach(i => { if (i.m === 'calculo') i.m = 'mat'; });
  Object.values(e.conceptos).forEach(c => { if (c.m === 'calculo') c.m = 'mat'; });
  e.eventos.forEach(ev => { if (ev.m === 'calculo') ev.m = 'mat'; });
  if (e.perfil?.misionesActivas) e.perfil.misionesActivas = null; // nuevas misiones
  if (e.perfil && !e.perfil.v2) { e.perfil.metaMinutos = 40; e.perfil.v2 = true; }
  return e;
}

export function guardar() {
  try { localStorage.setItem(KEY, JSON.stringify(estado)); }
  catch (e) { console.error('No se pudo guardar', e); }
  oyentes.forEach(f => f(estado));
}

export const S = () => estado;
export const alCambiar = f => { oyentes.add(f); return () => oyentes.delete(f); };

export function dia(f = hoy()) {
  if (!estado.dias[f]) estado.dias[f] = { xp: 0, ejercicios: 0, correctas: 0, segundos: 0, misiones: [] };
  return estado.dias[f];
}

export function exportar() {
  return JSON.stringify(estado, null, 1);
}
export function importar(texto) {
  const d = JSON.parse(texto);
  if (!d || d.v !== 1 || typeof d.xp !== 'number') throw new Error('El archivo no es un respaldo de MENTIS');
  estado = migrar(Object.assign(estadoInicial(), d));
  guardar();
}
export function borrarTodo() {
  estado = estadoInicial();
  guardar();
}

// Pedir al navegador que no borre los datos
export async function pedirPersistencia() {
  try { if (navigator.storage?.persist) return await navigator.storage.persist(); } catch {}
  return false;
}
