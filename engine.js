// MENTIS — motor de progreso: XP, niveles, rachas, conceptos, misiones y logros.
// Todo se calcula a partir de la actividad real guardada.
import { S, guardar, dia, hoy, sumarDias, difDias, fechaDe } from './store.js';

/* ---------------- Niveles ---------------- */
export const NIVELES = [
  { n: 'Exploradora', xp: 0 },
  { n: 'Aprendiz', xp: 150 },
  { n: 'Investigadora', xp: 500 },
  { n: 'Analista', xp: 1200 },
  { n: 'Pensadora', xp: 2500 },
  { n: 'Erudita', xp: 4500 },
  { n: 'Especialista', xp: 7500 },
  { n: 'Maestra', xp: 12000 },
];
const PASO_EXTRA = 6000; // después de Maestra: Maestra II, III...

export function nivelDe(xp) {
  let i = 0;
  while (i + 1 < NIVELES.length && xp >= NIVELES[i + 1].xp) i++;
  if (i === NIVELES.length - 1) {
    const extra = Math.floor((xp - NIVELES[i].xp) / PASO_EXTRA);
    const base = NIVELES[i].xp + extra * PASO_EXTRA;
    const romanos = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];
    return { num: i + 1 + extra, nombre: 'Maestra' + (romanos[extra] ?? ` ${extra + 1}`), desde: base, hasta: base + PASO_EXTRA, siguiente: 'Maestra' + (romanos[extra + 1] ?? ` ${extra + 2}`) };
  }
  return { num: i + 1, nombre: NIVELES[i].n, desde: NIVELES[i].xp, hasta: NIVELES[i + 1].xp, siguiente: NIVELES[i + 1].n };
}

/* ---------------- Materias ---------------- */
export const MATERIAS = {
  mat: { nombre: 'Matemáticas', icono: '🧮', color: 'rosa' },
  len: { nombre: 'Lengua y vocabulario', icono: '📖', color: 'lavanda' },
  geo: { nombre: 'Geografía', icono: '🌍', color: 'salvia' },
  cul: { nombre: 'Cultura general', icono: '🏛️', color: 'durazno' },
  log: { nombre: 'Lógica', icono: '🧩', color: 'lavanda' },
};

/* ---------------- Repaso espaciado ---------------- */
const INTERVALOS = [0, 1, 3, 7, 14, 30, 60]; // días según la "caja"

export function concepto(id, materia, nombre) {
  const s = S();
  if (!s.conceptos[id]) s.conceptos[id] = { m: materia, nombre, caja: 0, prox: hoy(), aciertos: [], diasAcierto: [], dominado: null, primeraVez: hoy(), retenido30: false };
  return s.conceptos[id];
}

export const precision = arr => arr.length ? arr.filter(Boolean).length / arr.length : 0;

/* ---------------- Registro de un intento ---------------- */
// Devuelve {xp, motivos:[texto], nuevoDominio:bool}
export function registrarIntento({ materia, id, nombre, ok, segundos, texto = false, voz = false }) {
  const s = S();
  const f = hoy();
  const d = dia(f);
  const c = concepto(id, materia, nombre);
  const motivos = [];
  let xp = 0;

  const ultimo = [...s.intentos].reverse().find(i => i.h === id);
  const tocaRepaso = c.caja > 0 && c.prox <= f && !c.diasAcierto.includes(f);
  const tuvoErrorAntes = ultimo && !ultimo.ok;

  // Regreso después de una pausa (3+ días sin estudiar)
  const ultimoDia = ultimoDiaDeEstudio(f);
  const esPrimeroDelDia = d.ejercicios === 0;

  d.ejercicios++;
  d.segundos += Math.min(segundos, 120); // tiempo activo de respuesta, con tope por ejercicio
  if (ok) d.correctas++;

  s.intentos.push({ f, t: Date.now(), m: materia, h: id, ok, s: Math.round(segundos * 10) / 10, r: !!tuvoErrorAntes, ...(texto ? { tx: 1 } : {}), ...(voz ? { v: 1 } : {}) });

  if (ok) {
    // XP base con rendimientos decrecientes para no premiar repetir sin pensar
    const hechosHoy = s.intentos.filter(i => i.f === f && i.m === materia).length;
    let base = hechosHoy > 120 ? 1 : hechosHoy > 60 ? 2 : 4;
    xp += base;
    if (tuvoErrorAntes) { xp += 2; motivos.push('Mejoraste tras un error'); }
    if (tocaRepaso) { xp += 6; motivos.push('Repaso recordado'); }

    c.aciertos.push(true);
    // la caja sube como máximo una vez por día (el repaso espaciado exige días distintos)
    if (!c.diasAcierto.includes(f)) {
      if (c.prox <= f) c.caja = Math.min(c.caja + 1, INTERVALOS.length - 1);
      c.diasAcierto.push(f);
      c.prox = sumarDias(f, INTERVALOS[c.caja]);
    }
    // retención a 30 días
    if (c.dominado && !c.retenido30 && difDias(c.dominado, f) >= 30) {
      c.retenido30 = true; xp += 15; motivos.push('Concepto retenido 30 días');
    }
  } else {
    c.aciertos.push(false);
    c.caja = Math.max(0, c.caja - 2);
    c.prox = f;
  }
  if (c.aciertos.length > 12) c.aciertos = c.aciertos.slice(-12);

  // ¿Dominado? caja ≥3 (aciertos en días distintos y espaciados), ≥8 intentos recientes, ≥80% de acierto
  let nuevoDominio = false;
  if (!c.dominado && c.caja >= 3 && c.aciertos.length >= 8 && precision(c.aciertos.slice(-10)) >= 0.8) {
    c.dominado = f; nuevoDominio = true; xp += 30; motivos.push(`¡Dominaste: ${c.nombre}!`);
    evento('dominio', `Dominaste “${c.nombre}”.`);
  }
  // Si un concepto dominado cae mucho, deja de contar como dominado (verdad ante todo)
  if (c.dominado && c.aciertos.length >= 6 && precision(c.aciertos.slice(-6)) < 0.5) {
    c.dominado = null; c.retenido30 = false;
  }

  if (ok && esPrimeroDelDia && ultimoDia && difDias(ultimoDia, f) >= 3) {
    xp += 15; motivos.push('¡Bienvenida de vuelta!');
    evento('regreso', `Volviste a estudiar después de ${difDias(ultimoDia, f)} días.`);
    desbloquear('regreso');
  }

  if (ok && texto) { xp += 1; }
  sumarXP(xp);
  revisarMisiones();
  revisarLogros();
  guardar();
  return { xp, motivos, nuevoDominio };
}

export function registrarSesion({ materia, total, correctas, tipo = 'sesion' }) {
  const s = S();
  const f = hoy();
  let xp = 0; const motivos = [];
  // Bono solo si la sesión fue real (≥8 ejercicios) y con buena precisión
  if (total >= 8 && correctas / total >= 0.8) { xp += 10; motivos.push('Sesión excelente'); }
  s.eventos.push({ f, tipo, m: materia, total, correctas });
  if (s.eventos.length > 500) s.eventos = s.eventos.slice(-500);
  desbloquear('primera_leccion');
  sumarXP(xp);
  revisarMisiones();
  revisarLogros();
  guardar();
  return { xp, motivos };
}

export function evento(tipo, texto) {
  const s = S();
  s.eventos.push({ f: hoy(), tipo, texto });
  if (s.eventos.length > 500) s.eventos = s.eventos.slice(-500);
}

let nivelPrevio = null;
export function sumarXP(x) {
  if (!x) return;
  const s = S();
  const antes = nivelDe(s.xp).num;
  s.xp += x;
  dia().xp += x;
  const despues = nivelDe(s.xp);
  if (despues.num > antes) {
    evento('nivel', `Subiste a nivel ${despues.nombre}.`);
    nivelPrevio = despues;
  }
}
export function tomarSubidaDeNivel() { const n = nivelPrevio; nivelPrevio = null; return n; }

/* ---------------- Rachas ---------------- */
export const UMBRAL_DIA = 15; // XP mínima para que un día cuente como día de estudio

export const diaEstudiado = f => (S().dias[f]?.xp || 0) >= UMBRAL_DIA;
const esDescanso = f => (S().perfil?.descanso || []).includes(fechaDe(f).getDay());

function ultimoDiaDeEstudio(antesDe) {
  const fechas = Object.keys(S().dias).filter(f => f < antesDe && diaEstudiado(f)).sort();
  return fechas.at(-1) || null;
}

export function rachaActual() {
  const f0 = hoy();
  let f = diaEstudiado(f0) ? f0 : sumarDias(f0, -1);
  let n = 0;
  for (let i = 0; i < 4000; i++) {
    if (diaEstudiado(f)) n++;
    else if (!esDescanso(f)) break;
    f = sumarDias(f, -1);
    if (f < S().creado) break;
  }
  return n;
}

export function rachaMasLarga() {
  const s = S();
  let mejor = 0, act = 0;
  for (let f = s.creado; f <= hoy(); f = sumarDias(f, 1)) {
    if (diaEstudiado(f)) { act++; mejor = Math.max(mejor, act); }
    else if (!esDescanso(f) && f !== hoy()) act = 0;
  }
  return mejor;
}

export function semanaActual() {
  // lunes a domingo
  const d = new Date(); const dow = (d.getDay() + 6) % 7;
  const lunes = sumarDias(hoy(), -dow);
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  return { dias, estudiados: dias.filter(diaEstudiado).length, meta: S().perfil?.metaSemanal || 5 };
}

/* ---------------- Misiones ---------------- */
// Cada misión mide progreso con datos reales de hoy
const hoyI = (f, fn) => S().intentos.filter(i => i.f === f && fn(i));
export const PLANTILLAS = {
  clase: { texto: 'Completa tu clase del día', meta: 1, disponible: () => true,
    medir: f => S().clase?.fecha === f && S().clase.terminada ? 1 : 0 },
  examen8: { texto: 'Saca 8 de 10 o más en el mini examen', meta: 1, disponible: () => true,
    medir: f => S().eventos.some(e => e.f === f && e.tipo === 'examen' && e.correctas >= 8) ? 1 : 0 },
  mate10: { texto: 'Resuelve 10 ejercicios de matemáticas', meta: 10, disponible: () => true,
    medir: f => hoyI(f, i => i.m === 'mat' && i.ok).length },
  capitales5: { texto: 'Recuerda 5 capitales sin pistas', meta: 5, disponible: () => true,
    medir: f => hoyI(f, i => i.m === 'geo' && i.ok && i.tx).length },
  palabras3: { texto: 'Aprende 3 palabras y úsalas en una oración', meta: 1, disponible: () => true,
    medir: f => S().escritos.some(e => e.f === f && e.completo) ? 1 : 0 },
  oral: { texto: 'Responde 5 preguntas por voz', meta: 5, disponible: () => true,
    medir: f => hoyI(f, i => i.v && i.ok).length },
  logica: { texto: 'Resuelve 3 problemas de lógica', meta: 3, disponible: () => true,
    medir: f => hoyI(f, i => i.m === 'log' && i.ok).length },
  repasos: { texto: 'Completa tus repasos pendientes', meta: 1, disponible: () => pendientesInicioDia() > 0,
    medir: () => repasosPendientes().length === 0 ? 1 : 0 },
  precision: { texto: '20 ejercicios con 80% de aciertos o más', meta: 20, disponible: () => true,
    medir: f => { const h = S().intentos.filter(i => i.f === f); return precision(h.map(i => i.ok)) >= 0.8 ? h.length : Math.min(h.length, 19); } },
};
export const MISIONES_DEF = ['clase', 'examen8', 'mate10', 'capitales5', 'palabras3', 'oral', 'logica', 'repasos', 'precision'];


let _pendInicio = null;
function pendientesInicioDia() {
  const s = S();
  if (s.misiones.fecha === hoy() && s.misiones.pendInicio != null) return s.misiones.pendInicio;
  return repasosPendientes().length;
}

export function repasosPendientes() {
  const f = hoy();
  return Object.entries(S().conceptos).filter(([, c]) => c.caja > 0 && c.prox <= f && !c.diasAcierto.includes(f));
}

export function misionesDeHoy() {
  const s = S();
  const f = hoy();
  // si la lista de hoy trae misiones de una versión anterior, se vuelve a armar
  if (s.misiones.fecha === f && s.misiones.lista.some(m => !PLANTILLAS[m.id])) s.misiones.fecha = null;
  if (s.misiones.fecha !== f) {
    const elegidas = (s.perfil?.misionesActivas || MISIONES_DEF)
      .filter(id => PLANTILLAS[id]?.disponible());
    const n = s.perfil?.misionesPorDia || 3;
    // rotación determinista por fecha para variar sin azar caprichoso
    const semilla = Number(f.replaceAll('-', ''));
    const orden = elegidas.map((id, i) => ({ id, k: (semilla * (i + 7)) % 97 })).sort((a, b) => a.k - b.k).map(o => o.id);
    // los repasos pendientes siempre entran si existen
    if (elegidas.includes('repasos') && orden.indexOf('repasos') >= n) { orden.splice(orden.indexOf('repasos'), 1); orden.unshift('repasos'); }
    if (elegidas.includes('clase')) { orden.splice(orden.indexOf('clase'), 1); orden.unshift('clase'); }
    s.misiones = { fecha: f, pendInicio: repasosPendientes().length, lista: orden.slice(0, n).map(id => ({ id, hecha: false })) };
    guardar();
  }
  return s.misiones.lista.map(m => {
    const p = PLANTILLAS[m.id];
    const prog = Math.min(p.medir(f), p.meta);
    return { ...m, texto: p.texto, meta: p.meta, prog };
  });
}

export function revisarMisiones() {
  const s = S();
  if (s.misiones.fecha !== hoy()) return;
  const lista = misionesDeHoy();
  let nuevas = 0;
  lista.forEach((m, i) => {
    if (!s.misiones.lista[i].hecha && m.prog >= m.meta) {
      s.misiones.lista[i].hecha = true; nuevas++;
      dia().misiones.push(m.id);
      sumarXP(10);
      _misionRecien.push(m.texto);
    }
  });
  if (nuevas && s.misiones.lista.every(m => m.hecha) && !s.misiones.todas) {
    s.misiones.todas = true; sumarXP(20);
    evento('misiones', 'Completaste todas tus misiones del día.');
    desbloquear('misiones_dia');
  }
}
const _misionRecien = [];
export const tomarMisionesRecien = () => _misionRecien.splice(0);

/* ---------------- Logros ---------------- */
export const LOGROS = [
  { id: 'primera_leccion', t: 'Primera lección', d: 'Terminaste tu primera sesión de estudio.', i: '🌱' },
  { id: 'clase_1', t: 'Primera clase completa', d: 'Terminaste una clase del día con su mini examen.', i: '🎒' },
  { id: 'clase_7', t: 'Siete clases', d: 'Completaste 7 clases del día.', i: '📅', meta: () => S().eventos.filter(e => e.tipo === 'examen').length, total: 7 },
  { id: 'calc_100', t: '100 cálculos correctos', d: 'Resolviste 100 ejercicios de matemáticas bien.', i: '🧮', meta: () => contar('mat'), total: 100 },
  { id: 'paises_20', t: '20 países dominados', d: 'Dominaste 20 países y sus capitales.', i: '🌍', meta: () => dominadosDe('geo'), total: 20 },
  { id: 'palabras_50', t: '50 palabras aprendidas', d: 'Dominaste 50 palabras nuevas.', i: '📖', meta: () => dominadosDe('len'), total: 50 },
  { id: 'palabra_usada', t: 'Palabra en la vida real', d: 'Usaste una palabra nueva en una conversación.', i: '💬', meta: () => Object.values(S().conceptos).filter(c => c.usada).length, total: 1 },
  { id: 'voz_10', t: 'Relámpago', d: 'Respondiste 10 preguntas correctas por voz.', i: '⚡', meta: () => S().intentos.filter(i => i.v && i.ok).length, total: 10 },
  { id: 'semana', t: 'Primera semana de constancia', d: 'Llegaste a una racha de 7 días.', i: '🔥', meta: () => rachaMasLarga(), total: 7 },
  { id: 'retenidos_10', t: '10 conceptos retenidos 30 días', d: 'Recordaste 10 conceptos dominados 30 días después.', i: '🧠', meta: () => Object.values(S().conceptos).filter(c => c.retenido30).length, total: 10 },
  { id: 'libro_1', t: 'Primer libro comprendido', d: 'Aprobaste el mini examen de un libro que leíste.', i: '📚', meta: () => S().libros.filter(l => l.comprendido).length, total: 1 },
  { id: 'libro_5', t: 'Lectora', d: 'Cinco libros comprendidos.', i: '🦉', meta: () => S().libros.filter(l => l.comprendido).length, total: 5 },
  { id: 'evaluacion', t: 'Primera evaluación avanzada', d: 'Aprobaste un examen de nivel de Preparatoria o superior.', i: '🎓' },
  { id: 'harvard', t: 'Nivel Harvard', d: 'Llegaste al grado Harvard en una materia.', i: '🏛️', meta: () => Math.max(...Object.values(S().grados)), total: 5 },
  { id: 'primer_dominio', t: 'Primer concepto dominado', d: 'Dominaste tu primer concepto con repaso espaciado.', i: '⭐', meta: () => dominados(), total: 1 },
  { id: 'misiones_dia', t: 'Día completo', d: 'Completaste todas las misiones de un día.', i: '🎯' },
  { id: 'regreso', t: 'De vuelta', d: 'Regresaste a estudiar después de una pausa.', i: '🌤️' },
  { id: 'ensayo_1', t: 'Primer escrito', d: 'Escribiste usando tus palabras nuevas.', i: '✍️', meta: () => S().escritos.filter(e => e.completo).length, total: 1 },
];


const contar = m => S().intentos.filter(i => i.m === m && i.ok).length;
export const dominados = () => Object.values(S().conceptos).filter(c => c.dominado).length;
const dominadosDe = m => Object.values(S().conceptos).filter(c => c.m === m && c.dominado).length;

const _logroRecien = [];
export const tomarLogrosRecien = () => _logroRecien.splice(0);

export function desbloquear(id) {
  const s = S();
  if (s.logros[id]) return;
  s.logros[id] = hoy();
  const l = LOGROS.find(x => x.id === id);
  if (l) { _logroRecien.push(l); evento('logro', `Desbloqueaste “${l.t}”.`); }
}

export function revisarLogros() {
  LOGROS.forEach(l => { if (l.meta && l.total && l.meta() >= l.total) desbloquear(l.id); });
}

/* ---------------- Estadísticas ---------------- */
export function estadisticas() {
  const s = S();
  const f = hoy();
  const todos = s.intentos;
  const ultimos7 = Array.from({ length: 7 }, (_, i) => sumarDias(f, i - 6));
  const ultimos30 = Array.from({ length: 30 }, (_, i) => sumarDias(f, i - 29));

  // precisión por semana (8 semanas)
  const semanas = Array.from({ length: 8 }, (_, k) => {
    const fin = sumarDias(f, -7 * (7 - k)); const ini = sumarDias(fin, -6);
    const xs = todos.filter(i => i.f >= ini && i.f <= fin);
    return { ini, fin, n: xs.length, p: xs.length ? precision(xs.map(i => i.ok)) : null };
  });

  // materias: fuerza en últimos 30 días (mínimo 10 intentos para opinar)
  const desde30 = ultimos30[0];
  const porMateria = Object.keys(MATERIAS).map(m => {
    const xs = todos.filter(i => i.m === m && i.f >= desde30);
    return { m, n: xs.length, p: xs.length >= 10 ? precision(xs.map(i => i.ok)) : null };
  }).filter(x => x.p != null).sort((a, b) => b.p - a.p);

  // habilidades dentro de cada materia (para dar detalle real)
  const porConcepto = Object.entries(s.conceptos).map(([id, c]) => ({ id, ...c, p: c.aciertos.length >= 5 ? precision(c.aciertos.slice(-10)) : null }));

  const proximos = Object.entries(s.conceptos)
    .filter(([, c]) => c.caja > 0)
    .map(([id, c]) => ({ id, nombre: c.nombre, m: c.m, prox: c.prox }))
    .sort((a, b) => a.prox.localeCompare(b.prox));

  return {
    xp: s.xp,
    nivel: nivelDe(s.xp),
    dominados: dominados(),
    ejercicios: todos.length,
    correctas: todos.filter(i => i.ok).length,
    precisionTotal: todos.length ? precision(todos.map(i => i.ok)) : null,
    hoy: s.dias[f] || { xp: 0, ejercicios: 0, correctas: 0, segundos: 0 },
    semana7: ultimos7.map(d => ({ f: d, xp: s.dias[d]?.xp || 0, estudiado: diaEstudiado(d) })),
    mes30: ultimos30.map(d => ({ f: d, xp: s.dias[d]?.xp || 0, estudiado: diaEstudiado(d) })),
    semanas,
    racha: rachaActual(),
    rachaMax: rachaMasLarga(),
    semanaActual: semanaActual(),
    pendientes: repasosPendientes().length,
    proximos,
    porMateria,
    porConcepto,
    hitos: s.eventos.filter(e => ['dominio', 'nivel', 'logro', 'misiones', 'regreso'].includes(e.tipo)).slice(-8).reverse(),
  };
}

/* ---------------- Mascota: mensajes ligados a eventos reales ---------------- */
export function mensajeMascota() {
  const s = S();
  const st = estadisticas();
  const nombre = s.perfil?.nombre || '';
  const f = hoy();
  const ultimoEv = s.eventos.at(-1);
  const mis = misionesDeHoy();
  const faltan = mis.filter(m => !m.hecha).length;
  const ultimo = ultimoDiaDeEstudio(f);
  const clase = s.clase?.fecha === f ? s.clase : null;
  const R = (texto, pose) => ({ texto, pose });

  if (ultimoEv && ultimoEv.f === f && ultimoEv.tipo === 'nivel') return R(`${ultimoEv.texto} ¡Estoy muy orgullosa de ti!`, 'celebrar');
  if (ultimoEv && ultimoEv.f === f && ultimoEv.tipo === 'dominio') return R(`${ultimoEv.texto} Eso ya es tuyo. 🐾`, 'celebrar');
  if (st.hoy.ejercicios === 0 && ultimo && difDias(ultimo, f) >= 3) return R(`¡Hola${nombre ? ', ' + nombre : ''}! Te extrañé. Un ratito hoy ya cuenta, sin presión.`, 'triste');
  if (clase?.terminada && faltan === 0) return R('¡Clase y misiones completas! Hoy sí que aprendiste. Ya puedes descansar.', 'dormir');
  if (clase?.terminada) return R(`¡Clase terminada! ${faltan === 1 ? 'Te falta 1 misión.' : `Te faltan ${faltan} misiones.`}`, 'feliz');
  if (clase && clase.idx > 0) return R(`Vas en el paso ${clase.idx + 1} de ${clase.pasos.length} de tu clase. ¿Seguimos?`, 'jugar');
  if (st.pendientes > 0) return R(`Tienes ${st.pendientes} ${st.pendientes === 1 ? 'repaso listo' : 'repasos listos'}. Tu clase de hoy empieza por ahí.`, 'pensando');
  if (st.racha > 1) return R(`Llevas ${st.racha} días seguidos. ¿Empezamos la clase de hoy?`, 'feliz');
  return R(`¡Hola${nombre ? ', ' + nombre : ''}! Tu clase de hoy te espera.`, 'saludo');
}
