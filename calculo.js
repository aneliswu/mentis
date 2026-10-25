// MENTIS — Cálculo mental: habilidades con ejercicios generados (ilimitados)
import { S, hoy } from './store.js';
import { precision } from './engine.js';

const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const elegir = xs => xs[Math.floor(Math.random() * xs.length)];

export const HABILIDADES = [
  { id: 'calc:suma2', nombre: 'Sumas de 2 cifras', nivel: 1, gen: () => { const a = r(12, 89), b = r(11, 89); return { q: `${a} + ${b}`, a: a + b }; } },
  { id: 'calc:resta2', nombre: 'Restas de 2 cifras', nivel: 1, gen: () => { const a = r(30, 99), b = r(11, a - 5); return { q: `${a} − ${b}`, a: a - b }; } },
  { id: 'calc:tablas', nombre: 'Tablas de multiplicar', nivel: 1, gen: () => { const a = r(3, 9), b = r(3, 12); return { q: `${a} × ${b}`, a: a * b }; } },
  { id: 'calc:doble', nombre: 'Dobles y mitades', nivel: 1, gen: () => { if (Math.random() < .5) { const a = r(13, 99); return { q: `El doble de ${a}`, a: a * 2 }; } const a = r(7, 99) * 2; return { q: `La mitad de ${a}`, a: a / 2 }; } },
  { id: 'calc:suma3', nombre: 'Sumas de 3 cifras', nivel: 2, gen: () => { const a = r(120, 899), b = r(105, 899); return { q: `${a} + ${b}`, a: a + b }; } },
  { id: 'calc:resta3', nombre: 'Restas de 3 cifras', nivel: 2, gen: () => { const a = r(300, 999), b = r(101, a - 20); return { q: `${a} − ${b}`, a: a - b }; } },
  { id: 'calc:mult21', nombre: 'Multiplicar 2 cifras × 1 cifra', nivel: 2, gen: () => { const a = r(12, 99), b = r(3, 9); return { q: `${a} × ${b}`, a: a * b }; } },
  { id: 'calc:div', nombre: 'Divisiones exactas', nivel: 2, gen: () => { const b = r(3, 12), c = r(4, 15); return { q: `${b * c} ÷ ${b}`, a: c }; } },
  { id: 'calc:pct', nombre: 'Porcentajes básicos (10, 25, 50 %)', nivel: 2, gen: () => { const p = elegir([10, 25, 50]); const base = p === 25 ? r(2, 40) * 4 : p === 50 ? r(5, 99) * 2 : r(2, 99) * 10; return { q: `${p} % de ${base}`, a: base * p / 100 }; } },
  { id: 'calc:pct2', nombre: 'Porcentajes intermedios (5, 15, 20, 75 %)', nivel: 3, gen: () => { const p = elegir([5, 15, 20, 75]); const base = r(2, 40) * 20; return { q: `${p} % de ${base}`, a: base * p / 100 }; } },
  { id: 'calc:cuad', nombre: 'Cuadrados (11 al 25)', nivel: 3, gen: () => { const a = r(11, 25); return { q: `${a}²`, a: a * a }; } },
  { id: 'calc:mult22', nombre: 'Multiplicar 2 cifras × 2 cifras', nivel: 3, gen: () => { const a = r(11, 39), b = r(11, 29); return { q: `${a} × ${b}`, a: a * b }; } },
];

export const habilidad = id => HABILIDADES.find(h => h.id === id);

export function estadoHabilidad(h) {
  const c = S().conceptos[h.id];
  if (!c) return { estado: 'nueva', p: null, c: null };
  const p = c.aciertos.length ? precision(c.aciertos.slice(-10)) : null;
  if (c.dominado) return { estado: 'dominada', p, c };
  if (c.caja > 0 && c.prox <= hoy() && !c.diasAcierto.includes(hoy())) return { estado: 'repaso', p, c };
  return { estado: 'practica', p, c };
}

// Mezcla adaptativa: repasos pendientes primero, luego lo que está en práctica,
// y abre habilidades nuevas solo cuando las anteriores van bien.
export function planAdaptativo(n = 10) {
  const est = HABILIDADES.map(h => ({ h, ...estadoHabilidad(h) }));
  const repaso = est.filter(e => e.estado === 'repaso');
  const practica = est.filter(e => e.estado === 'practica');
  const nivelOk = lvl => est.filter(e => e.h.nivel === lvl).every(e => e.estado === 'dominada' || (e.p != null && e.p >= 0.7));
  const nuevas = est.filter(e => e.estado === 'nueva' && (e.h.nivel === 1 || nivelOk(e.h.nivel - 1)));
  let pool = [...repaso, ...repaso, ...practica, ...practica, ...nuevas.slice(0, 2)];
  if (!pool.length) pool = est.filter(e => e.estado === 'dominada'); // mantenimiento
  if (!pool.length) pool = est.filter(e => e.h.nivel === 1);
  return Array.from({ length: n }, () => elegir(pool).h);
}
