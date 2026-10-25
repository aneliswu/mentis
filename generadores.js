// MENTIS — generadores de preguntas por materia y grado (funcionan sin internet)
import { PAISES } from './datos_paises.js';
import { VOCAB } from './datos_vocab.js';
import { CULTURA } from './datos_cultura.js';

export const GRADOS = ['', 'Básico', 'Secundaria', 'Preparatoria', 'Universidad', 'Harvard'];

const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const elegir = xs => xs[Math.floor(Math.random() * xs.length)];
export const barajar = xs => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ================= Números en palabras ================= */
const U = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const C = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
function menosDeMil(n) {
  if (n < 30) return U[n];
  if (n < 100) return D[Math.floor(n / 10)] + (n % 10 ? ' y ' + U[n % 10] : '');
  if (n === 100) return 'cien';
  return C[Math.floor(n / 100)] + (n % 100 ? ' ' + menosDeMil(n % 100) : '');
}
export function L(n) {
  if (typeof n === 'string') return n;
  if (n < 0) return 'menos ' + L(-n);
  if (!Number.isInteger(n)) {
    const [e, d] = String(n).split('.');
    return L(Number(e)) + ' punto ' + d.split('').map(x => U[+x]).join(' ');
  }
  if (n < 1000) return menosDeMil(n);
  if (n < 1e6) {
    const m = Math.floor(n / 1000), resto = n % 1000;
    return (m === 1 ? 'mil' : menosDeMil(m).replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un') + ' mil') + (resto ? ' ' + menosDeMil(resto) : '');
  }
  return String(n);
}
const ORD = ['', '', 'al cuadrado', 'al cubo', 'a la cuarta', 'a la quinta', 'a la sexta', 'a la séptima', 'a la octava', 'a la novena', 'a la décima'];
const FRAC = ['', '', 'medio', 'tercio', 'cuarto', 'quinto', 'sexto', 'séptimo', 'octavo', 'noveno', 'décimo'];
export function leerFraccion(a, b) {
  const nom = b <= 10 ? FRAC[b] : L(b).replace(/o$/, '') + 'avo';
  return (a === 1 ? 'un ' : L(a) + ' ') + nom + (a === 1 ? '' : 's');
}
const coef = (c, v = 'x') => (c === 1 ? '' : c === -1 ? '−' : c) + v;
const lcoef = (c, v = 'equis') => (c === 1 ? '' : L(c) + ' ') + v;
const signo = n => n < 0 ? ` − ${-n}` : ` + ${n}`;
const lsigno = n => n < 0 ? ` menos ${L(-n)}` : ` más ${L(n)}`;
const mcd = (a, b) => b ? mcd(b, a % b) : Math.abs(a);
const simpl = (a, b) => { const g = mcd(a, b); return [a / g, b / g]; };
const fr = (a, b) => b === 1 ? `${a}` : `${a}/${b}`;

/* ================= Matemáticas ================= */
// Cada habilidad genera {enunciado, lectura, tipo, a, opciones?, pista?}
export const MATE = [
  // Grado 1
  { id: 'calc:suma2', g: 1, nombre: 'Sumas de 2 cifras', gen: () => { const a = r(12, 89), b = r(11, 89); return { enunciado: `${a} + ${b}`, lectura: `${L(a)} más ${L(b)}`, tipo: 'num', a: a + b }; } },
  { id: 'calc:resta2', g: 1, nombre: 'Restas de 2 cifras', gen: () => { const a = r(30, 99), b = r(11, a - 5); return { enunciado: `${a} − ${b}`, lectura: `${L(a)} menos ${L(b)}`, tipo: 'num', a: a - b }; } },
  { id: 'calc:tablas', g: 1, nombre: 'Tablas de multiplicar', gen: () => { const a = r(3, 9), b = r(3, 12); return { enunciado: `${a} × ${b}`, lectura: `${L(a)} por ${L(b)}`, tipo: 'num', a: a * b }; } },
  { id: 'calc:doble', g: 1, nombre: 'Dobles y mitades', gen: () => { if (Math.random() < .5) { const a = r(13, 99); return { enunciado: `El doble de ${a}`, tipo: 'num', a: a * 2 }; } const a = r(7, 99) * 2; return { enunciado: `La mitad de ${a}`, tipo: 'num', a: a / 2 }; } },
  { id: 'calc:div', g: 1, nombre: 'Divisiones exactas', gen: () => { const b = r(3, 12), c = r(4, 15); return { enunciado: `${b * c} ÷ ${b}`, lectura: `${L(b * c)} entre ${L(b)}`, tipo: 'num', a: c }; } },
  // Grado 2
  { id: 'calc:suma3', g: 2, nombre: 'Sumas de 3 cifras', gen: () => { const a = r(120, 899), b = r(105, 899); return { enunciado: `${a} + ${b}`, lectura: `${L(a)} más ${L(b)}`, tipo: 'num', a: a + b }; } },
  { id: 'calc:resta3', g: 2, nombre: 'Restas de 3 cifras', gen: () => { const a = r(300, 999), b = r(101, a - 20); return { enunciado: `${a} − ${b}`, lectura: `${L(a)} menos ${L(b)}`, tipo: 'num', a: a - b }; } },
  { id: 'calc:mult21', g: 2, nombre: 'Multiplicar 2 cifras × 1 cifra', gen: () => { const a = r(12, 99), b = r(3, 9); return { enunciado: `${a} × ${b}`, lectura: `${L(a)} por ${L(b)}`, tipo: 'num', a: a * b }; } },
  { id: 'calc:pct', g: 2, nombre: 'Porcentajes básicos', gen: () => { const p = elegir([10, 25, 50]); const base = p === 25 ? r(2, 40) * 4 : p === 50 ? r(5, 99) * 2 : r(2, 99) * 10; return { enunciado: `${p} % de ${base}`, lectura: `${L(p)} por ciento de ${L(base)}`, tipo: 'num', a: base * p / 100, pista: p === 10 ? 'El 10 % es dividir entre 10.' : p === 25 ? 'El 25 % es la cuarta parte.' : 'El 50 % es la mitad.' }; } },
  { id: 'mat:jerarquia', g: 2, nombre: 'Jerarquía de operaciones', gen: () => { const a = r(2, 20), b = r(2, 9), c = r(2, 9); return { enunciado: `${a} + ${b} × ${c}`, lectura: `${L(a)} más ${L(b)} por ${L(c)}`, tipo: 'num', a: a + b * c, pista: 'Primero multiplicaciones y divisiones, después sumas y restas.' }; } },
  { id: 'mat:potencia', g: 2, nombre: 'Potencias', gen: () => { const b = elegir([2, 2, 3, 4, 5, 10]); const e = b === 2 ? r(3, 8) : b === 10 ? r(2, 5) : r(2, 3); return { enunciado: `${b}^${e}`, lectura: `${L(b)} ${ORD[e]}${e > 3 ? ' potencia' : ''}`, tipo: 'num', a: b ** e, pista: `Es multiplicar ${b} por sí mismo ${e} veces.` }; } },
  { id: 'mat:raiz', g: 2, nombre: 'Raíces cuadradas exactas', gen: () => { const a = r(4, 20); return { enunciado: `√${a * a}`, lectura: `raíz cuadrada de ${L(a * a)}`, tipo: 'num', a, pista: '¿Qué número multiplicado por sí mismo da eso?' }; } },
  { id: 'mat:fracsuma', g: 2, nombre: 'Suma de fracciones', gen: () => { const b = elegir([4, 6, 8, 10, 12]); const a1 = r(1, b - 2), a2 = r(1, b - a1 - 1); const [n, d] = simpl(a1 + a2, b); const ok = fr(n, d); const op = new Set([ok, `${a1 + a2}/${b * 2}`, `${a1 + a2}/${b + b}`]); while (op.size < 4) { const [nn, dd] = simpl(r(1, b - 1), b); op.add(fr(nn, dd)); } return { enunciado: `${a1}/${b} + ${a2}/${b}`, lectura: `${leerFraccion(a1, b)} más ${leerFraccion(a2, b)}`, tipo: 'opc', a: ok, opciones: barajar([ok, ...[...op].filter(x => x !== ok).slice(0, 3)]), pista: 'Con el mismo denominador, se suman los numeradores y se simplifica.' }; } },
  // Grado 3
  { id: 'mat:ec1', g: 3, nombre: 'Ecuaciones de primer grado', gen: () => { const x = r(-9, 12), a = elegir([2, 3, 4, 5, 6, 7]), b = r(-15, 20) || 4; const c = a * x + b; return { enunciado: `${coef(a)}${signo(b)} = ${String(c).replace('-', '−')}`, lectura: `${lcoef(a)}${lsigno(b)} igual a ${L(c)}. ¿Cuánto vale equis?`, tipo: 'num', a: x, pista: 'Pasa el número sumando o restando al otro lado y después divide.' }; } },
  { id: 'mat:evaluar', g: 3, nombre: 'Evaluar expresiones', gen: () => { const x = r(-5, 6), a = r(2, 5), b = r(-9, 9); return { enunciado: `${a}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}, si x = ${String(x).replace('-', '−')}`, lectura: `${L(a)} equis al cuadrado ${b < 0 ? 'menos' : 'más'} ${L(Math.abs(b))}, cuando equis vale ${L(x)}`, tipo: 'num', a: a * x * x + b, pista: 'Un número negativo al cuadrado da positivo.' }; } },
  { id: 'mat:descuento', g: 3, nombre: 'Descuentos y aumentos', gen: () => { const p = elegir([10, 15, 20, 25, 30, 40]); const precio = r(4, 60) * 20; const sube = Math.random() < .3; return { enunciado: `${sube ? 'Aumento' : 'Descuento'} del ${p} % sobre $${precio}. ¿Precio final?`, lectura: `${sube ? 'aumento' : 'descuento'} del ${L(p)} por ciento sobre ${L(precio)} pesos`, tipo: 'num', a: sube ? precio * (100 + p) / 100 : precio * (100 - p) / 100 }; } },
  { id: 'mat:reglatres', g: 3, nombre: 'Regla de tres', gen: () => { const a = r(2, 9), b = a * r(2, 12), c = a * r(2, 9); return { enunciado: `Si ${a} kg cuestan $${b}, ¿cuánto cuestan ${c} kg?`, tipo: 'num', a: b / a * c, pista: 'Primero calcula cuánto cuesta 1 kg.' }; } },
  { id: 'calc:cuad', g: 3, nombre: 'Cuadrados del 11 al 25', gen: () => { const a = r(11, 25); return { enunciado: `${a}²`, lectura: `${L(a)} al cuadrado`, tipo: 'num', a: a * a }; } },
  { id: 'calc:mult22', g: 3, nombre: 'Multiplicar 2 × 2 cifras', gen: () => { const a = r(11, 39), b = r(11, 29); return { enunciado: `${a} × ${b}`, lectura: `${L(a)} por ${L(b)}`, tipo: 'num', a: a * b }; } },
  { id: 'calc:pct2', g: 3, nombre: 'Porcentajes intermedios', gen: () => { const p = elegir([5, 15, 20, 75]); const base = r(2, 40) * 20; return { enunciado: `${p} % de ${base}`, lectura: `${L(p)} por ciento de ${L(base)}`, tipo: 'num', a: base * p / 100 }; } },
  // Grado 4
  { id: 'mat:sistema', g: 4, nombre: 'Sistemas de ecuaciones', gen: () => { const x = r(1, 12), y = r(1, 12); return { enunciado: `x + y = ${x + y}\nx − y = ${x - y}\n¿Cuánto vale x?`, lectura: `equis más ye igual a ${L(x + y)}; equis menos ye igual a ${L(x - y)}`, tipo: 'num', a: x, pista: 'Suma las dos ecuaciones: la y se cancela.' }; } },
  { id: 'mat:cuadratica', g: 4, nombre: 'Ecuaciones cuadráticas', gen: () => { let p, q; do { p = r(-6, 9); q = r(-6, 9); } while (p === q); const bq = -(p + q), c = p * q; const tb = bq ? ` ${bq < 0 ? '−' : '+'} ${Math.abs(bq) === 1 ? '' : Math.abs(bq)}x` : ''; const tc = c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''; return { enunciado: `x²${tb}${tc} = 0\n¿Cuál es la solución mayor?`, lectura: `equis al cuadrado${bq ? (bq < 0 ? ' menos ' : ' más ') + lcoef(Math.abs(bq)) : ''}${c ? lsigno(c) : ''} igual a cero`, tipo: 'num', a: Math.max(p, q), pista: 'Busca dos números que multiplicados den el término independiente y sumados den el coeficiente de x con el signo contrario.' }; } },
  { id: 'mat:log', g: 4, nombre: 'Logaritmos', gen: () => { const b = elegir([2, 3, 5, 10]); const e = b === 2 ? r(2, 9) : b === 10 ? r(1, 6) : r(2, 4); return { enunciado: `log${String(b).split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join('')}(${b ** e})`, lectura: `logaritmo en base ${L(b)} de ${L(b ** e)}`, tipo: 'num', a: e, pista: `¿A qué potencia hay que elevar ${b} para obtener ${b ** e}?` }; } },
  { id: 'mat:interes', g: 4, nombre: 'Interés compuesto', gen: () => { const c = elegir([1000, 2000, 5000, 10000]); const i = elegir([10, 20]); const n = elegir([2, 3]); return { enunciado: `$${c} al ${i} % anual compuesto durante ${n} años. ¿Monto final?`, lectura: `${L(c)} pesos al ${L(i)} por ciento anual compuesto durante ${L(n)} años`, tipo: 'num', a: Math.round(c * (1 + i / 100) ** n), pista: `Multiplica por ${1 + i / 100} una vez por cada año.` }; } },
  { id: 'mat:media', g: 4, nombre: 'Media (promedio)', gen: () => { const n = r(4, 6); const m = r(5, 40); const xs = Array.from({ length: n - 1 }, () => m + r(-8, 8)); xs.push(m * n - xs.reduce((a, b) => a + b, 0)); return { enunciado: `Promedio de: ${barajar(xs).join(', ')}`, tipo: 'num', a: m }; } },
  { id: 'mat:prob', g: 4, nombre: 'Probabilidad básica', gen: () => { const casos = [['Al lanzar un dado, probabilidad de sacar par', '1/2'], ['Al lanzar dos monedas, probabilidad de dos águilas', '1/4'], ['Al lanzar dos dados, probabilidad de que sumen 7', '1/6'], ['De una baraja de 52 cartas, probabilidad de sacar un as', '1/13'], ['Al lanzar un dado, probabilidad de sacar más de 4', '1/3']]; const [q, a] = elegir(casos); return { enunciado: q, tipo: 'opc', a, opciones: barajar([a, ...barajar(['1/2', '1/3', '1/4', '1/6', '1/13', '2/3', '1/12'].filter(x => x !== a)).slice(0, 3)]) }; } },
  // Grado 5
  { id: 'mat:derivada', g: 5, nombre: 'Derivadas', gen: () => { const a = r(1, 5), b = r(-6, 6), x = r(-3, 4); return { enunciado: `f(x) = ${coef(a, 'x²')}${b ? signo(b) + 'x' : ''}\n¿Cuánto vale f′(${x})?`, lectura: `efe de equis igual a ${lcoef(a, 'equis al cuadrado')}${b ? lsigno(b) + ' equis' : ''}. ¿Cuánto vale efe prima de ${L(x)}?`, tipo: 'num', a: 2 * a * x + b, pista: 'La derivada de ax² es 2ax y la de bx es b.' }; } },
  { id: 'mat:integral', g: 5, nombre: 'Integrales definidas', gen: () => { const k = elegir([3, 6]), n = r(1, 3); return { enunciado: `∫₀^${n} ${k}x² dx`, lectura: `la integral de cero a ${L(n)} de ${L(k)} equis al cuadrado, de equis`, tipo: 'num', a: k / 3 * n ** 3, pista: 'La integral de x² es x³/3.' }; } },
  { id: 'mat:comb', g: 5, nombre: 'Combinaciones', gen: () => { const n = r(5, 10), k = r(2, 3); let c = 1; for (let i = 0; i < k; i++) c = c * (n - i) / (i + 1); return { enunciado: `C(${n}, ${k}): ¿de cuántas formas eliges ${k} de ${n}?`, lectura: `combinaciones de ${L(n)} en ${L(k)}`, tipo: 'num', a: c, pista: 'n! / (k! · (n − k)!). El orden no importa.' }; } },
  { id: 'mat:perm', g: 5, nombre: 'Permutaciones', gen: () => { const n = r(3, 6); let f = 1; for (let i = 2; i <= n; i++) f *= i; return { enunciado: `¿De cuántas formas se pueden ordenar ${n} libros en un estante?`, tipo: 'num', a: f, pista: `${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(' × ')}` }; } },
];
export const habMate = id => MATE.find(h => h.id === id);

/* ================= Lógica ================= */
export const LOGICA = [
  { id: 'log:aritmetica', g: 1, nombre: 'Secuencias de suma', gen: () => { const a = r(1, 20), d = r(2, 9); const s = Array.from({ length: 5 }, (_, i) => a + d * i); return { enunciado: `${s.slice(0, 4).join(', ')}, ¿?`, tipo: 'num', a: s[4] }; } },
  { id: 'log:geometrica', g: 2, nombre: 'Secuencias de multiplicación', gen: () => { const a = r(1, 5), q = r(2, 3); const s = Array.from({ length: 5 }, (_, i) => a * q ** i); return { enunciado: `${s.slice(0, 4).join(', ')}, ¿?`, tipo: 'num', a: s[4] }; } },
  { id: 'log:alterna', g: 3, nombre: 'Secuencias alternadas', gen: () => { let x = r(1, 9); const k = r(2, 5); const s = [x]; for (let i = 1; i < 6; i++) { x = i % 2 ? x + k : x * 2; s.push(x); } return { enunciado: `${s.slice(0, 5).join(', ')}, ¿?`, tipo: 'num', a: s[5], pista: 'Hay dos operaciones que se turnan.' }; } },
  { id: 'log:cuadrados', g: 3, nombre: 'Diferencias crecientes', gen: () => { const a = r(1, 10), d = r(1, 4); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + d * i); return { enunciado: `${s.slice(0, 5).join(', ')}, ¿?`, tipo: 'num', a: s[5], pista: 'Fíjate en cuánto aumenta cada vez.' }; } },
  { id: 'log:intercalada', g: 4, nombre: 'Secuencias intercaladas', gen: () => { const a = r(1, 9), b = r(20, 40), d1 = r(2, 5), d2 = r(1, 4); const s = []; for (let i = 0; i < 4; i++) { s.push(a + d1 * i); s.push(b - d2 * i); } return { enunciado: `${s.slice(0, 7).join(', ')}, ¿?`, tipo: 'num', a: s[7], pista: 'Son dos secuencias mezcladas.' }; } },
  { id: 'log:fibo', g: 5, nombre: 'Secuencias recursivas', gen: () => { const s = [r(1, 5), r(1, 6)]; for (let i = 2; i < 7; i++) s.push(s[i - 1] + s[i - 2]); return { enunciado: `${s.slice(0, 6).join(', ')}, ¿?`, tipo: 'num', a: s[6], pista: 'Cada término depende de los dos anteriores.' }; } },
];
const ACERTIJOS = [
  [1, 'Si todos los gatos son mamíferos y Michi es un gato, entonces…', ['Michi es mamífero', 'Todos los mamíferos son gatos', 'Michi no es mamífero', 'No se puede saber'], 'Es un silogismo válido.'],
  [1, 'Ana es más alta que Bea, y Bea es más alta que Carla. ¿Quién es la más baja?', ['Carla', 'Ana', 'Bea', 'No se puede saber'], 'Ana > Bea > Carla.'],
  [2, 'Un bat y una pelota cuestan $110. El bat cuesta $100 más que la pelota. ¿Cuánto cuesta la pelota?', ['$5', '$10', '$1', '$15'], 'Pelota = x, bat = x + 100; 2x + 100 = 110, x = 5.'],
  [2, 'Si 5 máquinas hacen 5 piezas en 5 minutos, ¿cuánto tardan 100 máquinas en hacer 100 piezas?', ['5 minutos', '100 minutos', '20 minutos', '1 minuto'], 'Cada máquina hace una pieza en 5 minutos.'],
  [3, 'Algunos médicos son atletas. Todos los atletas son disciplinados. ¿Qué es seguro?', ['Algunos médicos son disciplinados', 'Todos los médicos son disciplinados', 'Ningún médico es disciplinado', 'Todos los disciplinados son médicos'], 'Los médicos que son atletas son disciplinados.'],
  [3, 'Un nenúfar duplica su tamaño cada día y cubre el lago en 48 días. ¿En cuántos días cubre la mitad?', ['47', '24', '46', '12'], 'Un día antes de cubrirlo todo estaba a la mitad.'],
  [4, '“Si llueve, la calle se moja.” La calle está mojada. ¿Qué se puede concluir con certeza?', ['Nada seguro sobre la lluvia', 'Llovió', 'No llovió', 'Va a llover'], 'Afirmar el consecuente es una falacia: la calle pudo mojarse por otra causa.'],
  [4, '¿Cuál es la negación de “Todos los alumnos aprobaron”?', ['Al menos un alumno no aprobó', 'Ningún alumno aprobó', 'Todos reprobaron', 'Algunos aprobaron'], 'Basta un contraejemplo para negar un “todos”.'],
  [5, 'Si “P implica Q” es verdadero y Q es falso, ¿qué pasa con P?', ['P es falso', 'P es verdadero', 'No se puede saber', 'P y Q son iguales'], 'Es el modus tollens.'],
];

/* ================= Comprobar respuestas ================= */
export const normalizar = t => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[’'´`.,;:¡!¿?"()]/g, '').replace(/^(la|el|los|las)\s+/, '').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return m[a.length][b.length];
}
export function textoCorrecto(resp, aceptadas) {
  const x = normalizar(resp); if (!x) return false;
  return aceptadas.some(a => { const y = normalizar(a); const tol = y.length <= 5 ? 1 : 2; return x === y || lev(x, y) <= tol; });
}
export function esCorrecta(p, resp) {
  if (p.tipo === 'num') return Math.abs(Number(String(resp).replace(',', '.')) - Number(p.a)) < 1e-9;
  if (p.tipo === 'opc') return resp === p.a;
  return textoCorrecto(resp, [p.a, ...(p.acepta || [])]);
}

/* ================= Preguntas por materia ================= */
const idPais = p => 'cap:' + p[0];
const idVoc = w => 'voc:' + w[0];
const idCul = c => 'cul:' + normalizar(c[2]).slice(0, 48);

export function preguntaMate(h) {
  const q = h.gen();
  return { materia: 'mat', id: h.id, nombre: h.nombre, ...q };
}
export function preguntaLogica(g) {
  if (Math.random() < 0.35) {
    const pool = ACERTIJOS.filter(a => a[0] <= g);
    const a = elegir(pool);
    return { materia: 'log', id: 'log:acertijo:' + normalizar(a[1]).slice(0, 30), nombre: 'Razonamiento', enunciado: a[1], tipo: 'opc', a: a[2][0], opciones: barajar(a[2]), explicacion: a[3] };
  }
  const pool = LOGICA.filter(l => l.g <= g);
  const l = elegir(pool.filter(x => x.g >= g - 1).length ? pool.filter(x => x.g >= g - 1) : pool);
  return { materia: 'log', id: l.id, nombre: l.nombre, ...l.gen() };
}
export function preguntaPais(p, modo) {
  const [pais, cap, cont, , alt = []] = p;
  if (modo === 'inversa') {
    const otros = barajar(PAISES.filter(x => x[2] === cont && x[0] !== pais)).slice(0, 3).map(x => x[0]);
    return { materia: 'geo', id: idPais(p), nombre: `${pais} – ${cap}`, pais, capital: cap, enunciado: `¿De qué país es capital ${cap}?`, tipo: 'opc', a: pais, opciones: barajar([pais, ...otros]) };
  }
  if (modo === 'texto') return { materia: 'geo', id: idPais(p), nombre: `${pais} – ${cap}`, pais, capital: cap, enunciado: `Capital de ${pais}`, tipo: 'texto', a: cap, acepta: alt, pista: `Está en ${cont}.` };
  const otros = barajar(PAISES.filter(x => x[2] === cont && x[1] !== cap)).slice(0, 3).map(x => x[1]);
  return { materia: 'geo', id: idPais(p), nombre: `${pais} – ${cap}`, pais, capital: cap, enunciado: `¿Cuál es la capital de ${pais}?`, tipo: 'opc', a: cap, opciones: barajar([cap, ...otros]) };
}
export function preguntaVocab(w, modo) {
  const [pal, def, ej] = w;
  const otros = barajar(VOCAB.filter(x => x[0] !== pal)).slice(0, 3);
  if (modo === 'frase') {
    const hueco = ej.replace(new RegExp(pal.slice(0, Math.max(4, pal.length - 2)) + '\\w*', 'i'), '_____');
    if (hueco !== ej) return { materia: 'len', id: idVoc(w), nombre: pal, enunciado: `Completa: “${hueco}”`, tipo: 'texto', a: pal, acepta: [ej.match(new RegExp(pal.slice(0, Math.max(4, pal.length - 2)) + '\\w*', 'i'))[0]], pista: def, explicacion: ej };
  }
  if (modo === 'pal') return { materia: 'len', id: idVoc(w), nombre: pal, enunciado: `¿Qué significa “${pal}”?`, tipo: 'opc', a: def, opciones: barajar([def, ...otros.map(o => o[1])]), explicacion: ej };
  return { materia: 'len', id: idVoc(w), nombre: pal, enunciado: `¿Qué palabra significa: “${def}”?`, tipo: 'opc', a: pal, opciones: barajar([pal, ...otros.map(o => o[0])]), explicacion: ej };
}
export function preguntaCultura(c) {
  return { materia: 'cul', id: idCul(c), nombre: c[2].slice(0, 60), categoria: c[0], enunciado: c[2], tipo: 'opc', a: c[3][0], opciones: barajar(c[3]), explicacion: c[4] };
}

/* ================= Reconstruir pregunta desde un concepto (repasos / examen) ================= */
export function preguntaDeConcepto(id, c) {
  if (id.startsWith('cap:')) { const p = PAISES.find(x => idPais(x) === id); return p && preguntaPais(p, (c?.caja || 0) >= 2 ? 'texto' : 'opc'); }
  if (id.startsWith('voc:')) { const w = VOCAB.find(x => idVoc(x) === id); return w && preguntaVocab(w, (c?.caja || 0) >= 2 ? 'frase' : elegir(['def', 'pal'])); }
  if (id.startsWith('cul:')) { const k = CULTURA.find(x => idCul(x) === id); return k && preguntaCultura(k); }
  if (id.startsWith('log:acertijo')) { const a = ACERTIJOS.find(x => 'log:acertijo:' + normalizar(x[1]).slice(0, 30) === id); return a && { materia: 'log', id, nombre: 'Razonamiento', enunciado: a[1], tipo: 'opc', a: a[2][0], opciones: barajar(a[2]), explicacion: a[3] }; }
  if (id.startsWith('log:')) { const l = LOGICA.find(x => x.id === id); return l && { materia: 'log', id, nombre: l.nombre, ...l.gen() }; }
  const h = habMate(id); return h && preguntaMate(h);
}

/* ================= Selección según grado y memoria ================= */
// prioriza: lo que no has visto o no dominas, del grado actual y el anterior
function priorizar(items, idDe, conceptos, f, g, gDe) {
  return barajar(items).sort((a, b) => peso(a) - peso(b));
  function peso(x) {
    const c = conceptos[idDe(x)];
    let p = 0;
    if (c?.dominado) p += 3; else if (c) p += 1;
    if (c?.diasAcierto?.includes(f)) p += 4;
    p += Math.abs(g - gDe(x)) * 0.8;
    return p + Math.random() * 0.5;
  }
}
export function elegirMate(g, n, conceptos, f) {
  const pool = MATE.filter(h => h.g <= g && h.g >= g - 1);
  const orden = priorizar(pool, h => h.id, conceptos, f, g, h => h.g);
  return Array.from({ length: n }, (_, i) => preguntaMate(orden[i % Math.min(orden.length, 4)]));
}
export function elegirPaises(g, n, conceptos, f) {
  const gp = Math.min(g, 4);
  const pool = PAISES.filter(p => p[3] <= gp);
  const orden = priorizar(pool, idPais, conceptos, f, gp, p => p[3]).slice(0, n);
  return orden.map(p => {
    const c = conceptos[idPais(p)];
    const modo = g >= 5 && Math.random() < .5 ? 'inversa' : (c?.caja || 0) >= 2 || g >= 3 ? 'texto' : 'opc';
    return preguntaPais(p, modo);
  });
}
export function palabrasNuevas(g, n, conceptos) {
  const vistas = new Set(Object.keys(conceptos).filter(k => k.startsWith('voc:')));
  let pool = VOCAB.filter(w => !vistas.has(idVoc(w)) && w[3] <= g);
  pool.sort((a, b) => Math.abs(g - a[3]) - Math.abs(g - b[3]) || Math.random() - .5);
  if (pool.length < n) pool = pool.concat(VOCAB.filter(w => !vistas.has(idVoc(w)) && w[3] > g));
  return pool.slice(0, n);
}
export function elegirCultura(g, n, conceptos, f) {
  const pool = CULTURA.filter(c => c[1] <= g);
  return priorizar(pool, idCul, conceptos, f, g, c => c[1]).slice(0, n).map(preguntaCultura);
}

/* ================= Examen de nivel (grado siguiente) ================= */
export function examenNivel(materia, gObjetivo, conceptos, f) {
  const n = 10;
  if (materia === 'mat') { const pool = MATE.filter(h => h.g === gObjetivo); return Array.from({ length: n }, (_, i) => preguntaMate(pool[i % pool.length])); }
  if (materia === 'geo') { const gp = Math.min(gObjetivo, 4); const pool = barajar(PAISES.filter(p => p[3] === gp)).slice(0, n); return pool.map(p => preguntaPais(p, gObjetivo >= 5 ? elegir(['texto', 'inversa']) : gObjetivo >= 3 ? 'texto' : 'opc')); }
  if (materia === 'len') { const pool = barajar(VOCAB.filter(w => w[3] === gObjetivo)).slice(0, n); return pool.map(w => preguntaVocab(w, elegir(['def', 'pal']))); }
  if (materia === 'cul') { const pool = barajar(CULTURA.filter(c => c[1] === gObjetivo)).slice(0, n); return pool.map(preguntaCultura); }
  if (materia === 'log') return Array.from({ length: n }, () => preguntaLogica(gObjetivo));
  return [];
}

export { PAISES, VOCAB, CULTURA };
