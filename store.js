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
    ajustes: { tema: 'sistema', mascota: true, nombreMascota: 'Coco' },
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
    if (raw) return Object.assign(estadoInicial(), JSON.parse(raw));
  } catch (e) { console.warn('No se pudo leer el progreso', e); }
  return estadoInicial();
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
  estado = Object.assign(estadoInicial(), d);
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
