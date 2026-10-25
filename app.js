// MENTIS — interfaz
import { S, guardar, hoy, fechaDe, sumarDias, exportar, importar, borrarTodo, pedirPersistencia } from './store.js';
import * as E from './engine.js';
import * as G from './generadores.js';
import * as IA from './ia.js';
import * as V from './voz.js';

const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = x => x == null ? '—' : Math.round(x * 100) + ' %';
const DIAS_CORTOS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const DIAS_NOMBRE = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MAT = E.MATERIAS;

/* ================= Personajes ================= */
const POSES = {
  leylapi: { saludo: 3, feliz: 2, celebrar: 0, triste: 1, pensando: 7, dormir: 6, sorpresa: 7, jugar: 4, risa: 5 },
  kalipi: { saludo: 0, feliz: 5, celebrar: 11, triste: 9, pensando: 10, dormir: 7, sorpresa: 6, jugar: 12, risa: 15, animo: 14 },
};
const nombreDe = q => S().ajustes.nombres?.[q] || (q === 'leylapi' ? 'Leylapi' : 'Kalipi');
function pj(quien, pose = 'saludo', tam = 74, extra = '') {
  if (!S().ajustes.mascota) return '';
  const i = POSES[quien][pose] ?? POSES[quien].saludo;
  return `<img class="pj ${extra}" src="${quien}${i}.png" alt="${esc(nombreDe(quien))}" style="width:${tam}px;height:${tam}px">`;
}

/* ================= Tema ================= */
const mq = matchMedia('(prefers-color-scheme: dark)');
function aplicarTema() {
  const t = S().ajustes.tema;
  const oscuro = t === 'oscuro' || (t === 'sistema' && mq.matches);
  document.documentElement.dataset.tema = oscuro ? 'oscuro' : 'claro';
  $('meta[name=theme-color]').setAttribute('content', oscuro ? '#1B191E' : '#FBF7F2');
}
mq.addEventListener('change', aplicarTema);

/* ================= Utilidades visuales ================= */
function anillo(valor, color = 'url(#gradAnillo)', centro = '', tam = 108) {
  const R = 46, C = 2 * Math.PI * R;
  const off = C * (1 - Math.max(0, Math.min(1, valor)));
  return `<div class="anillo" style="width:${tam}px;height:${tam}px"><svg viewBox="0 0 108 108">
    <defs><linearGradient id="gradAnillo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--rosa)"/><stop offset="1" stop-color="var(--lavanda)"/></linearGradient></defs>
    <circle class="pista" cx="54" cy="54" r="${R}"/>
    <circle class="valor" cx="54" cy="54" r="${R}" stroke="${color}" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${off}"/>
  </svg><div class="centro">${centro}</div></div>`;
}
function animarEntrada() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    app.querySelectorAll('.anillo .valor').forEach(c => c.style.strokeDashoffset = c.dataset.off);
    app.querySelectorAll('[data-w]').forEach(b => b.style.width = b.dataset.w);
    app.querySelectorAll('[data-h]').forEach(b => b.style.height = b.dataset.h);
  }));
}
function confeti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cont = document.createElement('div'); cont.className = 'confeti';
  const colores = ['var(--rosa)', 'var(--lavanda)', 'var(--salvia)', 'var(--durazno)'];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%'; p.style.background = colores[i % 4];
    p.style.animationDuration = 1.6 + Math.random() * 1.4 + 's'; p.style.animationDelay = Math.random() * .4 + 's';
    cont.appendChild(p);
  }
  document.body.appendChild(cont); setTimeout(() => cont.remove(), 3500);
}
function toast(html, ms = 3200) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; document.body.appendChild(t); setTimeout(() => t.remove(), ms); }
function flotante(texto) { const f = document.createElement('div'); f.className = 'flotante'; f.textContent = texto; document.body.appendChild(f); setTimeout(() => f.remove(), 1000); }
function avisosPendientes() {
  const cola = [];
  const nivel = E.tomarSubidaDeNivel();
  if (nivel) cola.push(`${pj('leylapi', 'celebrar', 44)}<div><b>¡Nuevo nivel: ${nivel.nombre}!</b><div class="peq suave">Tu esfuerzo se nota.</div></div>`);
  E.tomarLogrosRecien().forEach(l => cola.push(`<span style="font-size:1.6rem">${l.i}</span><div><b>Logro: ${esc(l.t)}</b><div class="peq suave">${esc(l.d)}</div></div>`));
  E.tomarMisionesRecien().forEach(m => cola.push(`${pj('kalipi', 'celebrar', 44)}<div><b>Misión cumplida</b><div class="peq suave">${esc(m)} · +10 XP</div></div>`));
  if (cola.length) confeti();
  cola.forEach((h, i) => setTimeout(() => toast(h), i * 1800));
}
const boton = (texto, href, sec = false) => `<a class="btn ${sec ? 'sec' : ''}" href="${href}" style="display:block;text-align:center;text-decoration:none;margin-bottom:10px">${texto}</a>`;
const volver = (href, t) => `<a href="${href}" class="suave" style="text-decoration:none">‹ ${t}</a>`;

/* ================= Navegación ================= */
const TABS = [['inicio', '🏡', 'Inicio'], ['clase', '🎒', 'Clase'], ['estudiar', '📚', 'Estudiar'], ['libros', '📖', 'Libros'], ['perfil', '🌸', 'Perfil']];
const nav = actual => `<nav class="abajo">${TABS.map(([id, i, t]) => `<a href="#${id}" class="${actual === id ? 'on' : ''}"><span class="i">${i}</span>${t}</a>`).join('')}</nav>`;
let limpiar = null;
function render() {
  if (limpiar) { try { limpiar(); } catch {} limpiar = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  aplicarTema();
  if (!S().perfil) return vistaBienvenida();
  const [ruta, arg] = (location.hash.slice(1) || 'inicio').split('/');
  const vistas = { inicio: vistaInicio, clase: vistaClase, estudiar: vistaEstudiar, practica: () => vistaPractica(arg), nivel: () => vistaNivel(arg), voz: vistaVoz, concurso: vistaConcurso, libros: vistaLibros, perfil: vistaPerfil, misiones: vistaMisiones, logros: vistaLogros, ajustes: vistaAjustes };
  try { (vistas[ruta] || vistaInicio)(); }
  catch (err) {
    console.error(err);
    app.innerHTML = `<div class="vista" style="text-align:center;padding-top:30px">${pj('leylapi', 'triste', 100)}<h1>Algo salió mal</h1>
      <p class="suave peq">Error: ${esc(err.message)}</p><p class="suave peq">Mándale una captura de esta pantalla a quien te ayuda con la app.</p>
      <a class="btn" href="#perfil" style="display:block;text-decoration:none;margin-top:12px">Ir a Perfil</a></div>${nav('')}`;
  }
  window.scrollTo(0, 0);
  animarEntrada();
}
addEventListener('hashchange', render);
// ir a la misma ruta también debe volver a pintar (por ejemplo “Otra sesión”)
const ir = h => { if (location.hash === '#' + h) render(); else location.hash = h; };
document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); render(); } });

/* ================= Mapa del país (sin internet) ================= */
let MAPA = null;
const cargarMapa = () => MAPA ? Promise.resolve(MAPA) : import('./datos_mapa.js').then(m => (MAPA = m));
let BAND = null;
const cargarBanderas = () => BAND ? Promise.resolve(BAND) : import('./datos_banderas.js').then(m => (BAND = m.BANDERAS)).catch(() => (BAND = {}));
function etiquetasMapa(M, vb, pais, inf) {
  const [vx, vy, w, h] = vb; const fs = w / 42; const puestas = [];
  const choca = (x, y, txt) => { const a = txt.length * fs * 0.3, b = fs * 0.6; return puestas.some(p => Math.abs(p.x - x) < a + p.a && Math.abs(p.y - y) < b + p.b) ? null : { x, y, a, b }; };
  const objetivo = { x: inf.x, y: inf.y - fs * 1.1, a: pais.length * fs * 0.33, b: fs * 0.7 }; puestas.push(objetivo);
  const lista = M.ETIQUETAS.filter(([n, x, y]) => x > vx + fs && x < vx + w - fs && y > vy + fs && y < vy + h - fs && Math.hypot(x - inf.x, y - inf.y) > fs * 1.5)
    .sort((a, b) => b[3] - a[3]).slice(0, 40);
  let svg = '';
  for (const [n, x, y] of lista) {
    if (puestas.length > 16) break;
    const c = choca(x, y, n); if (!c) continue; puestas.push(c);
    svg += `<text x="${x}" y="${y}" class="m-eti" font-size="${(fs * 0.8).toFixed(2)}">${esc(n)}</text>`;
  }
  return svg + `<text x="${objetivo.x}" y="${objetivo.y}" class="m-eti fuerte" font-size="${fs.toFixed(2)}">${esc(pais)}</text>`;
}
const fmt = n => n.toLocaleString('es-MX');
function comparaMexico(area) {
  const r = area / 1964375;
  if (r >= 1.15) return `unas ${r >= 10 ? Math.round(r) : r.toFixed(1)} veces el tamaño de México`;
  if (r >= 0.85) return 'casi del mismo tamaño que México';
  if (area >= 30000) return `como el ${Math.max(1, Math.round(r * 100))} % de México`;
  const cdmx = area / 1495;
  return cdmx >= 1.5 ? `como ${Math.round(cdmx)} veces la Ciudad de México` : 'más o menos del tamaño de la Ciudad de México o más pequeño';
}
async function pintarMapa(contenedor, pais, capital) {
  const [M, B] = await Promise.all([cargarMapa(), cargarBanderas()]);
  const inf = M.INFO[pais]; if (!inf || !contenedor.isConnected) return;
  let [x0, y0, x1, y1] = inf.bb || [inf.x - 4, inf.y - 4, inf.x + 4, inf.y + 4];
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let h = Math.max((y1 - y0) * 1.9, (x1 - x0) * 1.9 / 2, 45); const w = h * 2;
  const vbA = [cx - w / 2, cy - h / 2, w, h].map(v => Math.round(v * 10) / 10); const vb = vbA.join(' ');
  const r = Math.max(w / 120, 1.2);
  const idiomas = inf.idiomas.length ? inf.idiomas.join(', ').replace(/, ([^,]*)$/, ' y $1') : '';
  const bandera = B[pais] ? `<img class="bandera" alt="Bandera de ${esc(pais)}" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(B[pais])}">` : '';
  contenedor.innerHTML = `<div class="mapa-card">
    <div class="mapa-cab">${bandera}<div><div class="etiqueta">Bandera y ubicación</div><b>${esc(pais)}</b></div></div>
    <svg viewBox="${vb}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mapa de ${esc(pais)}">
      <rect x="-1000" y="-1000" width="3000" height="2500" class="m-mar"/>
      <path d="${M.FONDO}" class="m-fondo"/>
      ${M.FORMAS[pais] ? `<path d="${M.FORMAS[pais]}" class="m-pais"/>` : ''}
      <circle cx="${inf.x}" cy="${inf.y}" r="${r * 2.6}" class="m-pulso"/>
      <circle cx="${inf.x}" cy="${inf.y}" r="${r}" class="m-punto"/>
      ${etiquetasMapa(M, vbA, pais, inf)}
    </svg>
    <div class="mapa-txt"><b>${esc(pais)}</b> está en ${esc(inf.sub)}. Su capital es <b>${esc(capital)}</b>.
      ${idiomas ? `Se habla ${esc(idiomas)}.` : ''} ${inf.moneda ? `Moneda: ${esc(inf.moneda)}.` : ''}
      Mide ${fmt(inf.area)} km², ${comparaMexico(inf.area)}${inf.mar ? '' : ', y no tiene salida al mar'}.</div></div>`;
}
const datosPais = p => { if (p.materia !== 'geo') return null; if (p.pais) return [p.pais, p.capital]; const [a, b] = (p.nombre || '').split(' – '); return a && b ? [a, b] : null; };

/* ================= Voz: entender la respuesta hablada ================= */
const ORDINALES = [['primera', 'primero', 'uno', 'la a', 'a'], ['segunda', 'segundo', 'dos', 'la b', 'b', 'be'], ['tercera', 'tercero', 'tres', 'la c', 'c', 'ce'], ['cuarta', 'cuarto', 'cuatro', 'la d', 'd', 'de']];
function interpretarVoz(p, alts) {
  if (p.tipo === 'num') { for (const a of alts) { const n = V.aNumero(a); if (n != null) return String(n); } return null; }
  if (p.tipo === 'texto') return alts.find(a => G.esCorrecta(p, a)) || alts[0] || null;
  for (const a of alts) {
    const x = G.normalizar(a);
    const hit = p.opciones.find(o => G.textoCorrecto(a, [o]) || (x.length >= 3 && G.normalizar(o).includes(x)) || (G.normalizar(o).length >= 3 && x.includes(G.normalizar(o))));
    if (hit) return hit;
    const k = ORDINALES.findIndex(ws => ws.some(w => x === w || x === 'la ' + w || x === 'opcion ' + w || x === 'el ' + w));
    if (k >= 0 && p.opciones[k]) return p.opciones[k];
  }
  return null;
}
async function escucharPara(boton, p, alEntender) {
  const txt = boton.innerHTML; boton.disabled = true; boton.innerHTML = '🎙️ Te escucho…'; boton.classList.add('escuchando');
  try {
    const alts = await V.escuchar();
    const r = interpretarVoz(p, alts);
    if (r == null) { boton.innerHTML = `No entendí “${esc(alts[0])}”. Toca para intentar otra vez`; }
    else { alEntender(r, alts[0]); return; }
  } catch (e) { boton.innerHTML = esc(e.message) + ' Toca para intentar otra vez'; }
  boton.disabled = false; boton.classList.remove('escuchando');
  setTimeout(() => { if (boton.isConnected && !boton.disabled) boton.innerHTML = txt; }, 3500);
}

/* =====================================================================
   Corredor de preguntas (lo usan la clase, la práctica y los exámenes)
   ===================================================================== */
function correr({ preguntas, titulo, salir, inicio = 0, previo = null, alAvanzar, alTerminar, examen = false }) {
  const ant = previo || { total: 0, correctas: 0, xp: 0 };
  let i = Math.min(inicio, preguntas.length), entrada = '', t0 = performance.now(), resultados = [], xpTotal = ant.xp, bloqueado = false;
  const acum = () => ({ total: ant.total + resultados.length, correctas: ant.correctas + resultados.filter(Boolean).length, xp: xpTotal });
  // si ya se contestó todo (salió en la última retroalimentación), se termina con lo guardado
  if (i >= preguntas.length) return alTerminar(acum());
  app.innerHTML = `<div class="vista">
    <div class="fila entre"><a href="${salir}" class="suave" style="text-decoration:none">✕ Salir</a><span class="peq suave">${esc(titulo)}</span><span class="chip lavanda" id="xpS">+${ant.xp} XP</span></div>
    <div class="card ejercicio" id="ej"></div></div>`;
  const ej = $('#ej');
  const pinta = () => {
    const p = preguntas[i]; entrada = ''; bloqueado = false; t0 = performance.now();
    const m = MAT[p.materia];
    ej.innerHTML = `
      <div class="puntos">${preguntas.map((_, k) => `<i class="${k < i ? (resultados[k - inicio] === false ? 'mal' : 'ok') : k === i ? 'act' : ''}"></i>`).join('')}</div>
      <div class="peq suave" style="margin-top:12px">${m ? m.icono + ' ' : ''}${esc(p.materia === 'geo' ? 'Capitales del mundo' : p.materia === 'len' ? 'Vocabulario' : (p.categoria || p.nombre || ''))}</div>
      <div class="pregunta ${p.enunciado.length > 28 ? 'larga' : ''}">${esc(p.enunciado)}</div>
      ${p.lectura ? `<button class="btn chico sec" id="leer" style="margin:2px auto 8px">🔈 ¿Cómo se lee?</button><div id="lectura" class="lectura" hidden>Se lee: <b>${esc(p.lectura)}</b></div>` : ''}
      <div id="zona"></div>
      ${V.puedeEscuchar() ? '<button class="btn chico sec mic" id="mic">🎙️ Responder con voz</button>' : ''}
      <div id="oiste" class="peq suave"></div><div id="fb"></div>`;
    if (p.lectura) $('#leer').onclick = () => { $('#lectura').hidden = false; V.hablar(p.lectura); };
    const zona = $('#zona');
    if (p.tipo === 'num') {
      zona.innerHTML = `<div class="respuesta" id="resp">&nbsp;</div>
        <div class="teclado">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}
        <button data-k="-">−</button><button data-k="0">0</button><button data-k=".">.</button>
        <button data-k="⌫">⌫</button><button data-k="ok" class="ir" style="grid-column:span 2">✓</button></div>`;
      zona.querySelector('.teclado').onclick = e => { const b = e.target.closest('button'); if (b) tecla(b.dataset.k); };
    } else if (p.tipo === 'opc') {
      zona.innerHTML = `<div class="opciones">${p.opciones.map((o, k) => `<button data-k="${k}">${esc(o)}</button>`).join('')}</div>`;
      zona.querySelector('.opciones').onclick = e => { const b = e.target.closest('button'); if (b && !bloqueado) responder(p.opciones[+b.dataset.k], b); };
    } else {
      zona.innerHTML = `<input type="text" id="txt" autocomplete="off" autocapitalize="sentences" placeholder="Escribe tu respuesta" style="text-align:center;font-size:1.1rem">
        <button class="btn" id="enviar" style="margin-top:10px">Responder</button>
        ${p.pista ? `<button class="btn chico sec" id="pista" style="margin-top:8px">Ver pista</button>` : ''}`;
      const txt = $('#txt'); setTimeout(() => txt.focus(), 50);
      $('#enviar').onclick = () => txt.value.trim() && responder(txt.value);
      txt.onkeydown = e => { if (e.key === 'Enter' && txt.value.trim()) responder(txt.value); };
      if (p.pista) $('#pista').onclick = e => { e.target.outerHTML = `<p class="peq suave">Pista: ${esc(p.pista)}</p>`; };
    }
    if ($('#mic')) $('#mic').onclick = e => escucharPara(e.currentTarget, p, (r, oido) => {
      if (bloqueado) return;
      $('#oiste').textContent = `Escuché: “${oido}”`;
      if (p.tipo === 'num') { entrada = r; $('#resp').textContent = r.replace('-', '−'); }
      if (p.tipo === 'texto') $('#txt').value = r;
      const b = p.tipo === 'opc' ? [...ej.querySelectorAll('.opciones button')].find(x => x.textContent === r) : null;
      $('#mic').remove();
      responder(r, b, true);
    });
  };
  const tecla = k => {
    if (bloqueado) return;
    if (k === 'ok') return entrada && entrada !== '-' && responder(entrada);
    if (k === '⌫') entrada = entrada.slice(0, -1);
    else if (k === '-') entrada = entrada.startsWith('-') ? entrada.slice(1) : '-' + entrada;
    else if (k === '.' && entrada.includes('.')) return;
    else if (entrada.length < 8) entrada += k;
    $('#resp').textContent = entrada.replace('-', '−') || ' ';
  };
  const teclado = e => {
    if (preguntas[i]?.tipo !== 'num' || bloqueado) return;
    if (/^\d$/.test(e.key) || e.key === '.' || e.key === '-') tecla(e.key); else if (e.key === 'Backspace') tecla('⌫'); else if (e.key === 'Enter') tecla('ok');
  };
  addEventListener('keydown', teclado);
  limpiar = () => removeEventListener('keydown', teclado);

  function responder(resp, boton, porVoz = false) {
    if (bloqueado) return; bloqueado = true;
    const p = preguntas[i];
    const ok = G.esCorrecta(p, resp);
    const seg = (performance.now() - t0) / 1000;
    let res = { xp: 0, motivos: [] };
    if (p.materia !== 'lib') res = E.registrarIntento({ materia: p.materia, id: p.id, nombre: p.nombre, ok, segundos: seg, texto: p.tipo === 'texto', voz: porVoz });
    resultados.push(ok); xpTotal += res.xp;
    $('#xpS').textContent = `+${xpTotal} XP`;
    if ($('#mic')) $('#mic').remove();
    if (p.tipo === 'num') $('#resp').classList.add(ok ? 'ok' : 'mal');
    if (p.tipo === 'opc') ej.querySelectorAll('.opciones button').forEach(b => { if (b.textContent === p.a) b.classList.add('ok'); else if (b === boton) b.classList.add('mal'); b.disabled = true; });
    if (res.xp) flotante(`+${res.xp} XP`);
    if (res.nuevoDominio) confeti();
    const detalle = [p.explicacion, !ok && p.pista].filter(Boolean).map(esc).join('<br>');
    $('#fb').innerHTML = `<div class="feedback ${ok ? 'si' : 'no'}">${pj('kalipi', ok ? 'feliz' : 'triste', 56)}
      <div style="flex:1;text-align:left"><b>${ok ? (res.motivos[0] ? esc(res.motivos.join(' · ')) : '¡Correcto!') : 'Casi…'}</b>
      ${!ok ? `<div>La respuesta era <b>${esc(p.a)}</b></div>` : ''}
      ${p.lectura && !ok ? `<div class="peq">Se lee: ${esc(p.lectura)}</div>` : ''}
      ${detalle && !examen ? `<div class="peq suave" style="margin-top:4px">${detalle}</div>` : ''}
      <div id="porque"></div></div></div>
      ${datosPais(p) ? '<div id="mapa"></div>' : ''}
      <div class="fila" style="margin-top:10px">${!ok && IA.iaLista() && !examen ? '<button class="btn sec chico" id="explica">💡 Explícamelo</button>' : ''}<button class="btn" id="sig">Siguiente</button></div>`;
    if ($('#explica')) $('#explica').onclick = async e => {
      e.target.disabled = true; $('#porque').innerHTML = '<p class="peq suave">La profe está pensando…</p>';
      try { $('#porque').innerHTML = `<p class="peq">${esc(await IA.explicar(p, resp)).replace(/\n/g, '<br>')}</p>`; } catch (err) { $('#porque').innerHTML = `<p class="peq suave">${esc(err.message)}</p>`; }
    };
    if (datosPais(p)) pintarMapa($('#mapa'), ...datosPais(p)).then(() => $('#fb')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    $('#fb').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    avisosPendientes();
    alAvanzar?.(i + 1, acum());
    const seguir = () => { i++; if (i >= preguntas.length) { limpiar?.(); limpiar = null; alTerminar(acum()); } else pinta(); };
    $('#sig').onclick = seguir;
    if (ok && !detalle && p.tipo !== 'texto' && !datosPais(p)) setTimeout(() => { if ($('#sig') && preguntas[i] === p) seguir(); }, 800);
  }
  pinta();
}

function pantallaResultado({ titulo, correctas, total, xp, extra = '', botones = '' }) {
  const bien = total && correctas / total >= 0.8;
  if (bien) confeti();
  app.innerHTML = `<div class="vista" style="text-align:center">
    <div class="fila" style="justify-content:center;gap:0">${pj('leylapi', bien ? 'celebrar' : correctas / total >= .5 ? 'feliz' : 'triste', 96, 'salta')}${pj('kalipi', bien ? 'celebrar' : 'animo', 80, 'salta')}</div>
    <h1>${titulo || (bien ? '¡Excelente!' : correctas / total >= .5 ? '¡Buen trabajo!' : 'Cada error también enseña')}</h1>
    <div class="card" style="margin-top:14px">
      <div class="fila" style="justify-content:center">${anillo(total ? correctas / total : 0, undefined, `<div><div class="serif" style="font-size:1.6rem">${correctas}/${total}</div><div class="etiqueta">correctas</div></div>`)}</div>
      <p style="margin-top:10px"><b>+${xp} XP</b></p>${extra}
    </div>${botones}</div>`;
  animarEntrada(); avisosPendientes();
}

/* ================= Bienvenida ================= */
function vistaBienvenida() {
  const borrador = { nombre: '', metaMinutos: 40, misionesPorDia: 3, metaSemanal: 5, descanso: [0] };
  app.innerHTML = `<div class="vista">
    <div style="text-align:center;margin:20px 0 10px">
      <div class="fila" style="justify-content:center;gap:0">${pj('leylapi', 'saludo', 110)}${pj('kalipi', 'saludo', 90)}</div>
      <h1 style="margin-top:10px">Bienvenida a MENTIS</h1>
      <p class="suave">Tu academia personal. Cada punto, nivel y racha sale de lo que de verdad aprendes.</p>
    </div>
    <div class="card">
      <label class="campo"><span>¿Cómo te llamo?</span><input type="text" id="nombre" maxlength="30" placeholder="Tu nombre"></label>
      <label class="campo"><span>Días que quieres estudiar por semana</span>
        <div class="seg" id="sem">${[3, 4, 5, 6, 7].map(m => `<button data-v="${m}" class="${m === 5 ? 'on' : ''}">${m}</button>`).join('')}</div></label>
      <label class="campo"><span>Días de descanso (no rompen tu racha)</span>
        <div class="dias" id="desc">${DIAS_CORTOS.map((d, i) => `<button data-v="${i}" class="${i === 0 ? 'on' : ''}" title="${DIAS_NOMBRE[i]}">${d}</button>`).join('')}</div></label>
      <button class="btn" id="empezar" style="margin-top:8px">Empezar</button>
    </div></div>`;
  $('#sem').onclick = e => { const b = e.target.closest('button'); if (!b) return; $('#sem').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); borrador.metaSemanal = +b.dataset.v; };
  $('#desc').onclick = e => { const b = e.target.closest('button'); if (!b) return; b.classList.toggle('on'); const v = +b.dataset.v; borrador.descanso = b.classList.contains('on') ? [...borrador.descanso, v] : borrador.descanso.filter(x => x !== v); };
  $('#empezar').onclick = () => { borrador.nombre = $('#nombre').value.trim(); S().perfil = borrador; guardar(); pedirPersistencia(); location.hash = 'inicio'; render(); };
}

/* ================= Inicio ================= */
function vistaInicio() {
  const s = S(); const st = E.estadisticas(); const nv = st.nivel;
  const progNivel = (s.xp - nv.desde) / (nv.hasta - nv.desde);
  const mis = E.misionesDeHoy(); const hechas = mis.filter(m => m.hecha).length;
  const minHoy = Math.round(st.hoy.segundos / 60);
  const metaMin = s.perfil.metaMinutos || 40;
  const fechaTxt = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const maxXp = Math.max(30, ...st.semana7.map(d => d.xp));
  const msg = E.mensajeMascota();
  const clase = s.clase?.fecha === hoy() ? s.clase : null;
  const libros = s.libros.filter(l => l.comprendido).length;

  app.innerHTML = `<div class="vista">
  <div class="saludo"><div><div class="fecha">${fechaTxt}</div><h1>Hola${s.perfil.nombre ? ', ' + esc(s.perfil.nombre) : ''}</h1></div>
    <span class="chip lavanda">Nivel ${nv.num}</span></div>

  ${s.ajustes.mascota ? `<div class="mascota">${pj('leylapi', msg.pose, 78)}<div class="globo">${esc(msg.texto)}</div></div>` : ''}

  <a href="#clase" class="card heroe" style="display:block;text-decoration:none;color:inherit">
    <div class="fila">
      <div style="flex:1"><div class="etiqueta">Clase del día · ~40 min</div>
        <h2 style="margin:4px 0">${clase?.terminada ? '¡Clase completada! ✓' : clase ? `Continuar · paso ${clase.idx + 1} de ${clase.pasos.length}` : 'Empezar mi clase'}</h2>
        <p class="peq suave">Repasos, matemáticas, vocabulario, geografía, cultura, lógica, escritura y mini examen.</p>
        ${clase ? `<div class="barra" style="margin-top:8px"><i data-w="${(clase.terminada ? 1 : clase.idx / clase.pasos.length) * 100}%"></i></div>` : ''}</div>
      ${pj('kalipi', clase?.terminada ? 'celebrar' : 'jugar', 70)}
    </div></a>

  <div class="card">
    <div class="fila">
      ${anillo(progNivel, undefined, `<div><div class="etiqueta">Nivel</div><div class="serif" style="font-size:1.6rem">${nv.num}</div></div>`)}
      <div style="flex:1"><div class="etiqueta">Tu nivel de entrenamiento</div>
        <h2 style="margin:2px 0 6px">${nv.nombre}</h2>
        <div class="barra"><i data-w="${progNivel * 100}%"></i></div>
        <p class="peq suave">${s.xp - nv.desde} / ${nv.hasta - nv.desde} XP para <b>${nv.siguiente}</b></p></div>
    </div></div>

  <div class="rejilla2">
    <div class="card"><div class="etiqueta">Hoy</div>
      <div class="fila" style="margin-top:6px">${anillo(Math.min(1, minHoy / metaMin), 'var(--salvia)', `<div><div class="serif" style="font-size:1.3rem">${st.hoy.segundos > 0 && minHoy === 0 ? '<1' : minHoy}</div><div class="etiqueta">de ${metaMin} min</div></div>`, 84)}</div>
      <p class="peq suave" style="margin-top:6px">${st.hoy.correctas}/${st.hoy.ejercicios} correctas · +${st.hoy.xp} XP</p></div>
    <div class="card"><div class="etiqueta">Racha</div>
      <div class="num">${st.racha} <span style="font-size:1rem">🔥</span></div>
      <p class="peq suave">Récord: ${st.rachaMax} ${st.rachaMax === 1 ? 'día' : 'días'}</p>
      <p class="peq suave">Semana: ${st.semanaActual.estudiados}/${st.semanaActual.meta} días</p></div>
  </div>

  <div class="card">
    <div class="fila entre"><h2 style="margin:0">Misiones de hoy</h2><a href="#misiones" class="chip rosa" style="text-decoration:none">${hechas}/${mis.length}</a></div>
    <div class="barra" style="margin:10px 0 12px"><i data-w="${mis.length ? hechas / mis.length * 100 : 0}%"></i></div>
    <div class="lista">${mis.map(m => `<div class="item"><span class="check ${m.hecha ? 'si' : ''}">${m.hecha ? '✓' : ''}</span><div class="cuerpo"><div class="t" style="font-weight:600">${esc(m.texto)}</div>${m.meta > 1 ? `<div class="peq suave">${m.prog}/${m.meta}</div>` : ''}</div></div>`).join('')}</div>
  </div>

  <div class="card"><h2>De 0 a Harvard</h2>${tablaGrados()}<a href="#estudiar" class="peq" style="color:var(--lavanda)">Hacer un examen de nivel ›</a></div>

  <div class="rejilla2">
    <div class="card"><div class="etiqueta">Conceptos dominados</div><div class="num">${st.dominados}</div></div>
    <div class="card"><div class="etiqueta">Ejercicios</div><div class="num">${st.ejercicios}</div><p class="peq suave">Precisión ${pct(st.precisionTotal)}</p></div>
  </div>

  <div class="card"><h2>Actividad de la semana</h2>
    <div class="barras7">${st.semana7.map(d => `<div class="col ${d.f === hoy() ? 'hoy' : ''}"><div class="b"><i data-h="${d.xp / maxXp * 100}%"></i></div><span class="d">${DIAS_CORTOS[fechaDe(d.f).getDay()]}</span></div>`).join('')}</div>
    <p class="peq suave" style="margin-top:8px">XP ganada por día</p></div>

  <div class="card"><h2>Últimos 30 días</h2>${calendario30(st.mes30)}
    <p class="peq suave" style="margin-top:8px">Un día cuenta como estudiado desde ${E.UMBRAL_DIA} XP.</p></div>

  <div class="card"><h2>Precisión y retención</h2>${graficaPrecision(st.semanas)}</div>

  <div class="card"><h2>Próximos repasos</h2>
    ${st.proximos.length ? `<div class="lista">${st.proximos.slice(0, 5).map(p => `<div class="item"><span class="ico" style="background:var(--lavanda-bg)">${MAT[p.m]?.icono || '•'}</span><div class="cuerpo"><div class="t">${esc(p.nombre)}</div><div class="peq suave">${textoFecha(p.prox)}</div></div></div>`).join('')}</div>`
      : '<p class="suave peq">Aparecerán cuando practiques. MENTIS te recordará cada concepto justo antes de que se te olvide.</p>'}</div>

  <div class="card"><h2>Tus materias</h2>${fortalezas(st)}</div>

  <a href="#libros" class="card" style="display:flex;gap:12px;align-items:center;text-decoration:none;color:inherit"><span style="font-size:2rem">📚</span><div><h3>Libros comprendidos: ${libros}</h3><p class="peq suave">${s.libros.length ? `${s.libros.length} en tu biblioteca` : 'Agrega los libros que leas'}</p></div></a>

  ${st.hitos.length ? `<div class="card"><h2>Hitos recientes</h2><div class="lista">${st.hitos.map(h => `<div class="item"><span class="ico" style="background:var(--rosa-bg)">${{ dominio: '⭐', nivel: '🎓', logro: '🏅', misiones: '🎯', regreso: '🌤️', grado: '🏛️' }[h.tipo] || '✨'}</span><div class="cuerpo"><div class="t" style="font-weight:600">${esc(h.texto)}</div><div class="peq suave">${textoFecha(h.f)}</div></div></div>`).join('')}</div></div>` : ''}
  </div>${nav('inicio')}`;
}
function tablaGrados() {
  const g = S().grados;
  return `<div class="lista" style="gap:8px;margin-bottom:8px">${Object.entries(MAT).map(([id, m]) => `
    <div><div class="fila entre peq"><span>${m.icono} ${m.nombre}</span><b>${G.GRADOS[g[id]]}</b></div>
    <div class="barra" style="height:7px;margin-top:4px"><i data-w="${g[id] / 5 * 100}%"></i></div></div>`).join('')}</div>`;
}
function textoFecha(f) {
  const d = Math.round((fechaDe(f) - fechaDe(hoy())) / 86400000);
  if (d === 0) return 'Hoy'; if (d === 1) return 'Mañana'; if (d === -1) return 'Ayer';
  return d > 1 ? `En ${d} días` : `Hace ${-d} días`;
}
function calendario30(mes) {
  const huecos = (fechaDe(mes[0].f).getDay() + 6) % 7;
  const cab = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<span style="background:none;font-weight:800">${d}</span>`).join('');
  return `<div class="calendario">${cab}${'<span style="background:none"></span>'.repeat(huecos)}${mes.map(d => {
    const n = d.xp === 0 ? '' : d.xp < E.UMBRAL_DIA ? 'n1' : d.xp < 60 ? 'n2' : 'n3';
    return `<span class="${n} ${d.f === hoy() ? 'hoy' : ''}" title="${d.f}: ${d.xp} XP">${fechaDe(d.f).getDate()}</span>`;
  }).join('')}</div>`;
}
function graficaPrecision(semanas) {
  const conDatos = semanas.map((s, i) => ({ x: i, y: s.p })).filter(p => p.y != null);
  if (conDatos.length < 2) return '<p class="suave peq">Necesito al menos dos semanas con práctica para mostrar tu tendencia real.</p>';
  const W = 300, H = 80, X = i => 10 + i * (W - 20) / 7, Y = v => H - 8 - v * (H - 16);
  const d = conDatos.map((p, k) => `${k ? 'L' : 'M'}${X(p.x)},${Y(p.y)}`).join(' ');
  return `<div class="linea"><svg viewBox="0 0 ${W} ${H}"><path d="${d}" fill="none" stroke="var(--lavanda)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${conDatos.map(p => `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="4" fill="var(--rosa)"/>`).join('')}</svg></div>
    <p class="peq suave">Precisión semanal (8 semanas). Última: ${pct(conDatos.at(-1).y)}</p>`;
}
function fortalezas(st) {
  const habs = st.porConcepto.filter(c => c.p != null).sort((a, b) => b.p - a.p);
  if (!habs.length) return '<p class="suave peq">Cuando practiques al menos 5 veces un tema, aquí verás tus puntos fuertes y lo que conviene reforzar.</p>';
  const fuertes = habs.filter(h => h.p >= 0.8).slice(0, 3);
  const flojas = habs.filter(h => h.p < 0.7).slice(-3).reverse();
  return `${st.porMateria.map(m => `<div class="fila entre" style="margin-bottom:8px"><span>${MAT[m.m].icono} ${MAT[m.m].nombre}</span><span class="chip salvia">${pct(m.p)}</span></div>`).join('')}
    <div class="etiqueta" style="margin-top:6px">Lo más fuerte</div>
    <p class="peq">${fuertes.length ? fuertes.map(h => `${esc(h.nombre)} (${pct(h.p)})`).join(' · ') : 'Todavía nada sobre 80 %. ¡Ya llegará!'}</p>
    <div class="etiqueta" style="margin-top:6px">Para reforzar</div>
    <p class="peq">${flojas.length ? flojas.map(h => `${esc(h.nombre)} (${pct(h.p)})`).join(' · ') : 'Nada por debajo de 70 %. 👏'}</p>`;
}

/* =====================================================================
   CLASE DEL DÍA
   ===================================================================== */
const CATEGORIAS = ['Historia', 'Ciencias', 'Arte y literatura', 'Filosofía', 'Economía', 'Geografía', 'Inglés'];
function construirClase() {
  const s = S(); const f = hoy(); const g = s.grados; const C = s.conceptos;
  const pasos = [];
  const due = E.repasosPendientes().slice(0, 8).map(([id, c]) => s.bancoIA[id] ? { ...s.bancoIA[id], opciones: G.barajar(s.bancoIA[id].opciones) } : G.preguntaDeConcepto(id, c)).filter(Boolean);
  if (due.length) pasos.push({ tipo: 'preguntas', titulo: 'Repasos', icono: '🔁', preguntas: due });
  const ayer = s.ultimasPalabras;
  if (ayer && ayer.f < f && ayer.lista?.length && !ayer.revisado) pasos.push({ tipo: 'uso', titulo: '¿Usaste tus palabras?', icono: '💬', palabras: ayer.lista });
  pasos.push({ tipo: 'preguntas', titulo: 'Matemáticas', icono: '🧮', preguntas: G.elegirMate(g.mat, 8, C, f) });
  const nuevas = G.palabrasNuevas(g.len, 3, C);
  pasos.push({ tipo: 'vocab', titulo: 'Palabras del día', icono: '📖', palabras: nuevas, preguntas: nuevas.map(w => G.preguntaVocab(w, Math.random() < .5 ? 'def' : 'pal')) });
  pasos.push({ tipo: 'preguntas', titulo: 'Geografía', icono: '🌍', preguntas: G.elegirPaises(g.geo, 6, C, f) });
  const cat = CATEGORIAS[(fechaDe(f).getDate() + fechaDe(f).getMonth()) % CATEGORIAS.length];
  pasos.push({ tipo: 'cultura', titulo: `Cultura: ${cat}`, icono: '🏛️', categoria: cat, preguntas: null });
  pasos.push({ tipo: 'preguntas', titulo: 'Lógica', icono: '🧩', preguntas: Array.from({ length: 4 }, () => G.preguntaLogica(g.log)) });
  pasos.push({ tipo: 'escritura', titulo: 'Escribe con tus palabras', icono: '✍️', palabras: nuevas.map(w => w[0]) });
  pasos.push({ tipo: 'examen', titulo: 'Mini examen', icono: '📝', preguntas: null });
  s.clase = { fecha: f, idx: 0, pasos, terminada: false };
  s.ultimasPalabras = { f, lista: nuevas.map(w => w[0]), revisado: false };
  guardar();
}

function vistaClase() {
  const s = S();
  if (s.clase?.fecha !== hoy()) {
    app.innerHTML = `<div class="vista" style="text-align:center">
      <div class="fila" style="justify-content:center;gap:0;margin-top:10px">${pj('leylapi', 'feliz', 110)}${pj('kalipi', 'saludo', 90)}</div>
      <h1>Tu clase de hoy</h1><p class="suave">Unos 40 minutos. Puedes pausar cuando quieras: se guarda en qué paso vas.</p>
      <div class="card" style="text-align:left;margin-top:14px"><div class="lista" style="gap:6px">
        ${['🔁 Repasos pendientes', '💬 ¿Usaste las palabras de ayer?', '🧮 Matemáticas (con cómo se lee)', '📖 3 palabras nuevas', '🌍 Geografía', '🏛️ Cultura general (lección con IA o banco)', '🧩 Lógica', '✍️ Escribe con tus palabras', '📝 Mini examen de todo lo del día'].map(t => `<div class="peq">${t}</div>`).join('')}
      </div></div>
      <button class="btn" id="empezar">Empezar</button></div>${nav('clase')}`;
    $('#empezar').onclick = () => { construirClase(); render(); };
    return;
  }
  const c = s.clase;
  if (c.terminada) return resumenClase();
  const paso = c.pasos[c.idx];
  const siguiente = () => { c.idx++; paso.inicio = 0; guardar(); if (c.idx >= c.pasos.length) { c.terminada = true; guardar(); } render(); };
  const encabezado = `<div class="fila entre" style="margin-bottom:10px">${volver('#inicio', 'Inicio')}<span class="chip lavanda">Paso ${c.idx + 1} de ${c.pasos.length}</span></div>
    <div class="barra" style="margin-bottom:14px"><i data-w="${c.idx / c.pasos.length * 100}%"></i></div>`;

  if (paso.tipo === 'preguntas') {
    return correr({ preguntas: paso.preguntas, titulo: `${paso.icono} ${paso.titulo}`, salir: '#inicio', inicio: paso.inicio || 0, previo: paso.acum,
      alAvanzar: (i, a) => { paso.inicio = i; paso.acum = a; guardar(); },
      alTerminar: r => { paso.res = r; E.registrarSesion({ materia: paso.preguntas[0]?.materia || 'mix', total: r.total, correctas: r.correctas }); entrePasos(paso, r, siguiente); } });
  }
  if (paso.tipo === 'vocab') {
    if (paso.leidas) return correr({ preguntas: paso.preguntas, titulo: '📖 Palabras del día', salir: '#inicio', inicio: paso.inicio || 0, previo: paso.acum, alAvanzar: (i, a) => { paso.inicio = i; paso.acum = a; guardar(); }, alTerminar: r => entrePasos(paso, r, siguiente) });
    app.innerHTML = `<div class="vista">${encabezado}<h1 style="margin-bottom:6px">📖 Palabras del día</h1>
      <p class="suave peq" style="margin-bottom:12px">Léelas con calma. El reto: úsalas hoy en una plática o un mensaje. Mañana te pregunto.</p>
      ${paso.palabras.map(([p, d, e]) => `<div class="card palabra"><div class="fila entre"><h2 style="margin:0">${esc(p)}</h2><button class="btn chico sec" data-oir="${esc(p + '. ' + d + '. Por ejemplo: ' + e)}">🔈</button></div>
        <p>${esc(d)}</p><p class="peq suave"><i>“${esc(e)}”</i></p></div>`).join('')}
      <button class="btn" id="listo">Ya las leí, pregúntame</button></div>`;
    app.querySelectorAll('[data-oir]').forEach(b => b.onclick = () => V.hablar(b.dataset.oir));
    $('#listo').onclick = () => { paso.leidas = true; guardar(); render(); };
    return;
  }
  if (paso.tipo === 'cultura') {
    if (paso.preguntas && paso.vistaLeccion) return correr({ preguntas: paso.preguntas, titulo: `🏛️ ${paso.categoria}`, salir: '#inicio', inicio: paso.inicio || 0, previo: paso.acum, alAvanzar: (i, a) => { paso.inicio = i; paso.acum = a; guardar(); }, alTerminar: r => { E.registrarSesion({ materia: 'cul', total: r.total, correctas: r.correctas }); entrePasos(paso, r, siguiente); } });
    if (paso.preguntas) {
      const L = paso.leccion;
      app.innerHTML = `<div class="vista">${encabezado}
        ${L ? `<div class="card heroe"><div class="etiqueta">${esc(paso.categoria)} · ${G.GRADOS[S().grados.cul]}</div><h1 style="margin:6px 0 10px">${esc(L.titulo)}</h1>
          <p>${esc(L.explicacion)}</p>${L.dato ? `<p class="peq suave" style="margin-top:8px">✨ ${esc(L.dato)}</p>` : ''}
          <button class="btn chico sec" id="oir" style="margin-top:10px">🔈 Escuchar</button></div>`
        : `<div class="card"><h2>🏛️ Cultura general</h2><p class="peq suave">${esc(paso.aviso || 'Preguntas del banco de MENTIS, con su explicación al responder.')}</p>
            ${paso.fallaIA && IA.iaLista() ? '<button class="btn chico sec" id="reintentar" style="margin-top:10px">🔄 Intentar otra vez con la profe IA</button>' : ''}</div>`}
        <button class="btn" id="go">Responder preguntas</button></div>`;
      if ($('#oir')) $('#oir').onclick = () => V.hablar(`${L.titulo}. ${L.explicacion}`);
      if ($('#reintentar')) $('#reintentar').onclick = () => { paso.preguntas = null; paso.aviso = null; paso.fallaIA = false; guardar(); render(); };
      $('#go').onclick = () => { paso.vistaLeccion = true; guardar(); render(); };
      return;
    }
    // generar lección
    app.innerHTML = `<div class="vista">${encabezado}<div class="card" style="text-align:center">${pj('kalipi', 'pensando', 90)}<p>Preparando tu lección de ${esc(paso.categoria)}…</p></div></div>`;
    const g = S().grados.cul;
    const banco = () => { paso.preguntas = G.elegirCultura(g, 5, S().conceptos, hoy()); guardar(); };
    if (IA.iaLista()) {
      IA.leccionCultura(g, paso.categoria, S().eventos.filter(e => e.tipo === 'leccion').map(e => e.texto))
        .then(L => { if (L.preguntas.length < 3) throw new Error('Lección incompleta'); paso.leccion = L; paso.preguntas = L.preguntas; E.evento('leccion', L.titulo); guardar(); })
        .catch(err => { paso.aviso = `${err.message} Por ahora usaremos el banco de preguntas.`; paso.fallaIA = true; banco(); })
        .finally(() => { if (location.hash === '#clase') render(); });
    } else { paso.aviso = S().ia.key ? 'Sin internet: usaremos el banco de preguntas de MENTIS.' : 'Conecta Gemini en Perfil → Ajustes para recibir lecciones nuevas cada día. Hoy usaremos el banco de MENTIS.'; banco(); render(); }
    return;
  }
  if (paso.tipo === 'uso') {
    app.innerHTML = `<div class="vista">${encabezado}<div class="mascota">${pj('leylapi', 'pensando', 70)}<div class="globo">Ayer aprendiste estas palabras. ¿Usaste alguna en tu vida real? Sé honesta: solo cuenta si de verdad la usaste.</div></div>
      ${paso.palabras.map((p, k) => `<div class="card"><div class="fila entre"><h2 style="margin:0">${esc(p)}</h2><span class="interruptor"><input type="checkbox" data-k="${k}"><i></i></span></div>
        <input type="text" data-c="${k}" placeholder="¿Cómo la usaste? (opcional)" style="margin-top:10px" hidden></div>`).join('')}
      <button class="btn" id="listo">Continuar</button></div>`;
    app.querySelectorAll('input[type=checkbox]').forEach(ch => ch.onchange = () => { app.querySelector(`[data-c="${ch.dataset.k}"]`).hidden = !ch.checked; });
    $('#listo').onclick = () => {
      let n = 0;
      app.querySelectorAll('input[type=checkbox]').forEach(ch => {
        if (!ch.checked) return;
        const p = paso.palabras[+ch.dataset.k]; const c = S().conceptos['voc:' + p];
        if (c) { c.usada = (c.usada || 0) + 1; c.usos = [...(c.usos || []), { f: hoy(), como: app.querySelector(`[data-c="${ch.dataset.k}"]`).value.trim() }]; n++; }
      });
      if (n) { E.sumarXP(5 * n); E.evento('uso', `Usaste ${n} ${n === 1 ? 'palabra nueva' : 'palabras nuevas'} en la vida real.`); flotante(`+${5 * n} XP`); }
      S().ultimasPalabras.revisado = true; E.revisarLogros(); guardar(); avisosPendientes(); siguiente();
    };
    return;
  }
  if (paso.tipo === 'escritura') {
    app.innerHTML = `<div class="vista">${encabezado}<h1 style="margin-bottom:6px">✍️ Escribe con tus palabras</h1>
      <p class="suave peq">Escribe 2 o 3 oraciones sobre tu día usando estas palabras:</p>
      <div class="fila" style="flex-wrap:wrap;gap:8px;margin:10px 0" id="chips">${paso.palabras.map(p => `<span class="chip lavanda" data-p="${esc(p)}">${esc(p)}</span>`).join('')}</div>
      <textarea id="txt" rows="6" placeholder="Hoy…">${esc(paso.borrador || '')}</textarea>
      ${V.puedeEscuchar() ? '<button class="btn chico sec" id="dictar" style="margin-top:8px">🎙️ Dictar</button>' : ''}
      <div id="retro"></div>
      <button class="btn" id="guardar" style="margin-top:12px">Guardar y continuar</button>
      <button class="btn sec chico" id="saltar" style="margin-top:10px">Saltar por hoy</button></div>`;
    const txt = $('#txt');
    const usadas = () => paso.palabras.filter(p => { const raiz = G.normalizar(p).slice(0, Math.max(4, p.length - 2)); return G.normalizar(txt.value).split(' ').some(w => w.startsWith(raiz)); });
    const marcar = () => { const u = usadas(); $('#chips').querySelectorAll('[data-p]').forEach(c => c.className = 'chip ' + (u.includes(c.dataset.p) ? 'salvia' : 'lavanda')); paso.borrador = txt.value; };
    txt.oninput = marcar; marcar();
    if ($('#dictar')) $('#dictar').onclick = async e => {
      const b = e.currentTarget; b.disabled = true; b.textContent = '🎙️ Te escucho… (habla y haz una pausa al terminar)';
      try { const [t] = await V.escuchar(); txt.value = (txt.value.trim() + ' ' + t.charAt(0).toUpperCase() + t.slice(1) + '.').trim(); marcar(); b.textContent = '🎙️ Dictar otra oración'; }
      catch (err) { b.textContent = err.message + ' Toca para intentar otra vez'; }
      b.disabled = false;
    };
    $('#guardar').onclick = async () => {
      if (txt.value.trim().split(/\s+/).length < 8) return toast('<span>✍️</span><div>Escribe al menos un par de oraciones.</div>');
      const u = usadas(); const completo = u.length === paso.palabras.length;
      S().escritos.push({ f: hoy(), texto: txt.value.trim(), palabras: paso.palabras, completo });
      if (completo) { E.sumarXP(15); flotante('+15 XP'); }
      E.revisarMisiones(); E.revisarLogros(); guardar(); avisosPendientes();
      if (IA.iaLista()) {
        $('#guardar').disabled = true; $('#retro').innerHTML = '<p class="peq suave">La profe está leyendo tu texto…</p>';
        try {
          const r = await IA.retroEscritura(txt.value, paso.palabras);
          S().escritos.at(-1).retro = r; guardar();
          $('#retro').innerHTML = `<div class="card" style="margin-top:12px">${pj('leylapi', 'feliz', 50)}<p>${esc(r.comentario)}</p>${(r.correcciones || []).length ? `<ul class="peq">${r.correcciones.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>`;
          $('#guardar').disabled = false; $('#guardar').textContent = 'Continuar'; $('#guardar').onclick = siguiente; return;
        } catch (e) { $('#retro').innerHTML = `<p class="peq suave">${esc(e.message)}</p>`; }
      }
      siguiente();
    };
    $('#saltar').onclick = siguiente;
    return;
  }
  if (paso.tipo === 'examen') {
    if (!paso.preguntas) {
      const ids = [...new Set(c.pasos.flatMap(p => (p.preguntas || []).map(q => q.id)))];
      paso.preguntas = G.barajar(ids).slice(0, 10).map(id => S().bancoIA[id] ? { ...S().bancoIA[id], opciones: G.barajar(S().bancoIA[id].opciones) } : G.preguntaDeConcepto(id, S().conceptos[id])).filter(Boolean);
      guardar();
    }
    return correr({ preguntas: paso.preguntas, titulo: '📝 Mini examen', salir: '#inicio', examen: true, inicio: paso.inicio || 0, previo: paso.acum,
      alAvanzar: (i, a) => { paso.inicio = i; paso.acum = a; guardar(); },
      alTerminar: r => {
        paso.res = r; c.examen = r; c.terminada = true; c.idx = c.pasos.length;
        E.registrarSesion({ materia: 'mix', total: r.total, correctas: r.correctas, tipo: 'examen' });
        if (r.correctas >= 8) { E.sumarXP(25); }
        E.desbloquear('clase_1'); E.revisarMisiones(); E.revisarLogros(); guardar();
        resumenClase(true);
      } });
  }
}
function entrePasos(paso, r, siguiente) {
  const c = S().clase; paso.res = r;
  app.innerHTML = `<div class="vista" style="text-align:center;padding-top:30px">
    ${pj('kalipi', r.correctas / Math.max(1, r.total) >= .7 ? 'feliz' : 'animo', 100, 'salta')}
    <h1>${paso.icono} ${esc(paso.titulo)}: ${r.correctas}/${r.total}</h1>
    <p class="suave">+${r.xp} XP · ${c.pasos.length - c.idx - 1} ${c.pasos.length - c.idx - 1 === 1 ? 'paso más' : 'pasos más'}</p>
    <button class="btn" id="sig" style="margin-top:16px">Siguiente: ${esc(c.pasos[c.idx + 1]?.titulo || 'Fin')}</button>
    <a href="#inicio" class="btn sec" style="display:block;text-decoration:none;margin-top:10px">Pausar y volver después</a></div>`;
  avisosPendientes();
  $('#sig').onclick = siguiente;
  c.idx++; paso.inicio = 0; paso.acum = null; guardar(); // el progreso queda guardado aunque salga
  $('#sig').onclick = () => render();
}
function resumenClase(recien = false) {
  const c = S().clase; const r = c.examen || { correctas: 0, total: 0 };
  const xpHoy = S().dias[hoy()]?.xp || 0;
  pantallaResultado({ titulo: recien ? (r.correctas >= 8 ? '¡Clase completada con honores!' : '¡Clase completada!') : 'Clase de hoy completada ✓', correctas: r.correctas, total: r.total, xp: xpHoy,
    extra: `<p class="peq suave">XP de todo el día. ${r.correctas >= 8 ? 'Mini examen aprobado: +25 XP extra.' : 'Lo que fallaste volverá en tus repasos.'}</p>
      <div class="lista" style="text-align:left;margin-top:10px">${c.pasos.filter(p => p.res).map(p => `<div class="fila entre peq"><span>${p.icono} ${esc(p.titulo)}</span><b>${p.res.correctas}/${p.res.total}</b></div>`).join('')}</div>`,
    botones: boton('Volver al inicio', '#inicio') + boton('Seguir practicando', '#estudiar', true) });
}

/* ================= Estudiar ================= */
function vistaEstudiar() {
  const s = S();
  app.innerHTML = `<div class="vista"><h1 style="margin-bottom:6px">Estudiar</h1>
  <p class="suave peq" style="margin-bottom:14px">Práctica libre y exámenes de nivel. Aprueba con 8 de 10 para subir de grado.</p>
  <a href="#concurso" class="card heroe" style="display:flex;gap:12px;align-items:center;text-decoration:none;color:inherit">${pj('leylapi', 'jugar', 64)}<div><h2 style="margin:0">🏆 Modo concurso</h2><p class="peq suave">12 preguntas contrarreloj, de fácil a nivel Harvard. Récord: ${S().recordConcurso || 0} puntos.</p></div></a>
  <a href="#voz" class="card heroe" style="display:flex;gap:12px;align-items:center;text-decoration:none;color:inherit">${pj('kalipi', 'jugar', 64)}<div><h2 style="margin:0">⚡ Relámpago por voz</h2><p class="peq suave">60 segundos: te pregunto en voz alta y respondes hablando.</p></div></a>
  ${Object.entries(MAT).map(([id, m]) => {
    const g = s.grados[id]; const hoyHecho = s.examenesNivel[id]?.f === hoy();
    return `<div class="card"><div class="fila entre"><h2 style="margin:0">${m.icono} ${m.nombre}</h2><span class="chip ${m.color}">${G.GRADOS[g]}</span></div>
      <p class="peq suave" style="margin:6px 0 10px">${resumenMateria(id)}</p>
      <div class="fila"><a class="btn chico" href="#practica/${id}" style="text-decoration:none">Practicar</a>
      ${g < 5 ? `<a class="btn chico sec" href="#nivel/${id}" style="text-decoration:none;${hoyHecho ? 'opacity:.5' : ''}">Examen → ${G.GRADOS[g + 1]}</a>` : '<span class="chip salvia">🏛️ Grado máximo</span>'}</div></div>`;
  }).join('')}
  </div>${nav('estudiar')}`;
}
function resumenMateria(id) {
  const cs = Object.values(S().conceptos).filter(c => c.m === id);
  const dom = cs.filter(c => c.dominado).length;
  return cs.length ? `${dom} dominados de ${cs.length} practicados` : 'Aún sin empezar';
}
function preguntasMateria(id, n = 10) {
  const s = S(); const g = s.grados[id]; const f = hoy(); const C = s.conceptos;
  if (id === 'mat') return G.elegirMate(g, n, C, f);
  if (id === 'geo') return G.elegirPaises(g, n, C, f);
  if (id === 'cul') return G.elegirCultura(g, n, C, f);
  if (id === 'log') return Array.from({ length: n }, () => G.preguntaLogica(g));
  // lengua: repasa palabras ya vistas y agrega algunas nuevas
  const vistas = Object.keys(C).filter(k => k.startsWith('voc:')).map(k => G.VOCAB.find(w => 'voc:' + w[0] === k)).filter(Boolean);
  const pool = G.barajar([...vistas, ...G.palabrasNuevas(g, Math.max(3, n - vistas.length), C)]).slice(0, n);
  return pool.map(w => G.preguntaVocab(w, (C['voc:' + w[0]]?.caja || 0) >= 2 ? 'frase' : Math.random() < .5 ? 'def' : 'pal'));
}
function vistaPractica(id) {
  if (!MAT[id]) return ir('estudiar');
  const pregs = preguntasMateria(id);
  correr({ preguntas: pregs, titulo: `${MAT[id].icono} Práctica`, salir: '#estudiar', alTerminar: r => {
    const b = E.registrarSesion({ materia: id, total: r.total, correctas: r.correctas });
    pantallaResultado({ correctas: r.correctas, total: r.total, xp: r.xp + b.xp, botones: boton('Otra sesión', `#practica/${id}`) + boton('Volver', '#estudiar', true) });
  } });
}
function vistaNivel(id) {
  const s = S(); if (!MAT[id]) return ir('estudiar');
  const g = s.grados[id];
  if (g >= 5) return ir('estudiar');
  if (s.examenesNivel[id]?.f === hoy()) {
    app.innerHTML = `<div class="vista" style="text-align:center;padding-top:30px">${pj('leylapi', 'dormir', 110)}<h1>Mañana otra vez</h1>
      <p class="suave">Ya hiciste hoy el examen de ${MAT[id].nombre}. Un examen por día por materia, para que mida lo que de verdad sabes y no la memoria de hace cinco minutos.</p>${boton('Volver', '#estudiar')}</div>${nav('estudiar')}`;
    return;
  }
  app.innerHTML = `<div class="vista">${volver('#estudiar', 'Estudiar')}
    <div class="card heroe" style="margin-top:10px;text-align:center">${pj('kalipi', 'animo', 90)}
      <h1>Examen de nivel</h1><p>${MAT[id].icono} ${MAT[id].nombre}: de <b>${G.GRADOS[g]}</b> a <b>${G.GRADOS[g + 1]}</b></p>
      <p class="peq suave">10 preguntas del nivel ${G.GRADOS[g + 1]}. Necesitas 8 correctas. Sin explicaciones hasta el final.</p></div>
    <button class="btn" id="go">Empezar examen</button></div>`;
  $('#go').onclick = () => {
    const pregs = G.examenNivel(id, g + 1, s.conceptos, hoy());
    correr({ preguntas: pregs, titulo: `🎓 ${MAT[id].nombre}`, salir: '#estudiar', examen: true, alTerminar: r => {
      const aprobado = r.correctas >= 8;
      s.examenesNivel[id] = { f: hoy(), correctas: r.correctas, total: r.total, aprobado, grado: g + 1 };
      if (aprobado) {
        s.grados[id] = g + 1; E.sumarXP(50); E.evento('grado', `Subiste a ${G.GRADOS[g + 1]} en ${MAT[id].nombre}.`);
        if (g + 1 >= 3) E.desbloquear('evaluacion');
      }
      E.registrarSesion({ materia: id, total: r.total, correctas: r.correctas, tipo: 'nivel' });
      E.revisarLogros(); guardar();
      pantallaResultado({ titulo: aprobado ? `¡Ahora eres ${G.GRADOS[g + 1]} en ${MAT[id].nombre}!` : 'Todavía no, pero ya casi', correctas: r.correctas, total: r.total, xp: r.xp + (aprobado ? 50 : 0),
        extra: `<p class="peq suave">${aprobado ? 'Desde mañana tu clase del día usará el nuevo nivel.' : 'Practica este nivel unos días y vuelve a intentarlo mañana.'}</p>`, botones: boton('Volver', '#estudiar') });
    } });
  };
}

/* ================= Relámpago por voz ================= */
function vistaVoz() {
  const s = S();
  app.innerHTML = `<div class="vista">${volver('#estudiar', 'Estudiar')}
    <div class="card heroe" style="margin-top:10px;text-align:center" id="caja">${pj('kalipi', 'jugar', 100)}
      <h1>⚡ Relámpago por voz</h1>
      <p class="peq">Tienes 60 segundos. Escucha la pregunta y responde en voz alta: operaciones y capitales.</p>
      <p class="peq suave">${V.puedeEscuchar() ? 'Necesita internet para entender tu voz y permiso del micrófono.' : '⚠️ Este navegador no permite reconocimiento de voz. Ábrelo en Chrome.'}</p>
      <button class="btn" id="go" ${V.puedeEscuchar() ? '' : 'disabled'}>Empezar</button></div></div>${nav('estudiar')}`;
  $('#go').onclick = () => jugarVoz();
}
async function jugarVoz() {
  const s = S(); let vivo = true, correctas = 0, total = 0, xp = 0;
  const fin = Date.now() + 60000;
  limpiar = () => { vivo = false; };
  const gm = Math.min(s.grados.mat, 2), gg = Math.min(s.grados.geo, 3);
  const nueva = () => Math.random() < .55
    ? G.preguntaMate(G.elegir(G.MATE.filter(h => h.g <= gm && h.gen().tipo === 'num')))
    : G.preguntaPais(G.elegir(G.PAISES.filter(p => p[3] <= gg)), 'texto');
  app.innerHTML = `<div class="vista"><div class="fila entre"><a href="#estudiar" class="suave" style="text-decoration:none">✕ Salir</a><span class="chip rosa" id="reloj">60 s</span><span class="chip lavanda" id="marc">0 ✓</span></div>
    <div class="card ejercicio"><div id="pjv">${pj('kalipi', 'pensando', 90)}</div><div class="pregunta larga" id="pq"></div><div class="peq suave" id="oido">&nbsp;</div><div id="fbv" style="min-height:2rem"></div>
    <button class="btn sec chico" id="saltar" style="margin-top:10px">Saltar</button></div></div>`;
  const reloj = setInterval(() => { if (!vivo) return clearInterval(reloj); const r = Math.max(0, Math.ceil((fin - Date.now()) / 1000)); $('#reloj') && ($('#reloj').textContent = r + ' s'); }, 300);
  let saltar = false; $('#saltar').onclick = () => { saltar = true; };
  while (vivo && Date.now() < fin) {
    const p = nueva(); saltar = false;
    $('#pq').textContent = p.enunciado; $('#oido').innerHTML = '🔈 escuchando la pregunta…'; $('#fbv').innerHTML = '';
    await V.hablar(p.lectura || p.enunciado);
    if (!vivo) break;
    $('#oido').innerHTML = '🎙️ ¡Responde!';
    const t0 = performance.now();
    let alts;
    try { alts = await V.escuchar(); }
    catch (e) { if (!vivo) break; $('#oido').textContent = e.message; if (/micrófono|internet|navegador/.test(e.message)) { vivo = false; break; } await esperar(900); continue; }
    if (!vivo) break;
    if (saltar) continue;
    let ok = false;
    if (p.tipo === 'num') ok = alts.some(a => { const n = V.aNumero(a); return n != null && Math.abs(n - p.a) < 1e-9; });
    else ok = alts.some(a => G.textoCorrecto(a, [p.a, ...(p.acepta || [])]));
    total++; if (ok) correctas++;
    const r = E.registrarIntento({ materia: p.materia, id: p.id, nombre: p.nombre, ok, segundos: (performance.now() - t0) / 1000, voz: true, texto: p.tipo === 'texto' });
    xp += r.xp;
    $('#marc').textContent = `${correctas} ✓`;
    $('#oido').textContent = `Escuché: “${alts[0]}”`;
    $('#pjv').innerHTML = pj('kalipi', ok ? 'feliz' : 'triste', 90);
    $('#fbv').innerHTML = ok ? '<b style="color:var(--ok)">¡Correcto!</b>' : `<span>Era <b>${esc(p.a)}</b></span>`;
    if (r.xp) flotante(`+${r.xp} XP`);
    await esperar(ok ? 600 : 1300);
  }
  clearInterval(reloj);
  if (!location.hash.startsWith('#voz')) return;
  limpiar = null;
  E.registrarSesion({ materia: 'mix', total, correctas, tipo: 'voz' });
  pantallaResultado({ titulo: `⚡ ${correctas} en 60 segundos`, correctas, total, xp, extra: `<p class="peq suave">Récord personal: ${marcaVoz(correctas)}</p>`, botones: boton('Jugar otra vez', '#voz') + boton('Volver', '#estudiar', true) });
}
const esperar = ms => new Promise(r => setTimeout(r, ms));

/* ================= Modo concurso ================= */
function vistaConcurso() {
  const s = S();
  app.innerHTML = `<div class="vista">${volver('#estudiar', 'Estudiar')}
    <div class="card heroe" style="margin-top:10px;text-align:center">${pj('leylapi', 'jugar', 100)}
      <h1>🏆 Modo concurso</h1>
      <p class="peq">12 preguntas de cultura general, vocabulario y geografía. Empiezan fáciles y terminan en nivel Harvard.</p>
      <p class="peq suave">20 segundos por pregunta. Entre más rápido respondas, más puntos. Si encadenas aciertos, ganas bonus de racha. Puedes tocar o responder con voz.</p>
      <p style="margin:10px 0"><b>Tu récord: ${s.recordConcurso || 0} puntos</b></p>
      <button class="btn" id="go">¡Empezar!</button></div></div>${nav('estudiar')}`;
  $('#go').onclick = () => jugarConcurso();
}
function preguntasConcurso() {
  const C = S().conceptos, f = hoy(), usadas = new Set();
  return Array.from({ length: 12 }, (_, k) => {
    const g = Math.min(5, 1 + Math.floor(k * 5 / 12));
    let p = null;
    for (let t = 0; t < 8 && (!p || usadas.has(p.id)); t++) {
      if (k % 4 === 3) { const pool = G.PAISES.filter(x => x[3] === Math.min(4, g)); p = G.preguntaPais(G.elegir(pool), g >= 5 ? 'inversa' : 'opc'); }
      else if (k % 4 === 1) { const pool = G.VOCAB.filter(w => w[3] === g); p = G.preguntaVocab(G.elegir(pool), Math.random() < .5 ? 'def' : 'pal'); }
      else { const pool = G.CULTURA.filter(c => c[1] === g); p = G.preguntaCultura(G.elegir(pool)); }
    }
    usadas.add(p.id); return { ...p, grado: g };
  });
}
function jugarConcurso() {
  const pregs = preguntasConcurso(); const LIM = 20;
  let i = 0, puntos = 0, racha = 0, correctas = 0, xp = 0, timer = null, bloqueado = false;
  limpiar = () => clearInterval(timer);
  const pinta = () => {
    const p = pregs[i]; bloqueado = false; const t0 = performance.now();
    app.innerHTML = `<div class="vista"><div class="fila entre"><a href="#estudiar" class="suave" style="text-decoration:none">✕ Salir</a>
      <span class="chip lavanda">${i + 1}/12 · ${G.GRADOS[p.grado]}</span><span class="chip rosa">${puntos} pts</span></div>
      <div class="card ejercicio"><div class="barra" style="height:8px"><i id="tiempo" style="width:100%;transition:width .2s linear"></i></div>
        <div class="peq suave" style="margin-top:12px">${racha >= 2 ? `🔥 Racha ×${racha}` : esc(p.categoria || MAT[p.materia]?.nombre || '')}</div>
        <div class="pregunta larga">${esc(p.enunciado)}</div>
        <div class="opciones">${p.opciones.map((o, k) => `<button data-k="${k}">${esc(o)}</button>`).join('')}</div>
        ${V.puedeEscuchar() ? '<button class="btn chico sec" id="mic" style="margin-top:10px">🎙️ Responder con voz</button>' : ''}
        <div id="oiste" class="peq suave"></div><div id="fb"></div></div></div>`;
    const fin = Date.now() + LIM * 1000;
    clearInterval(timer);
    timer = setInterval(() => { const r = Math.max(0, fin - Date.now()); const b = $('#tiempo'); if (b) b.style.width = (r / (LIM * 10)) + '%'; if (r <= 0) responder(null); }, 200);
    app.querySelector('.opciones').onclick = e => { const b = e.target.closest('button'); if (b) responder(p.opciones[+b.dataset.k]); };
    if ($('#mic')) $('#mic').onclick = e => escucharPara(e.currentTarget, p, (r, oido) => { $('#oiste').textContent = `Escuché: “${oido}”`; responder(r, true); });
    function responder(resp, porVoz = false) {
      if (bloqueado) return; bloqueado = true; clearInterval(timer);
      const seg = (performance.now() - t0) / 1000;
      const ok = resp != null && G.esCorrecta(p, resp);
      const res = E.registrarIntento({ materia: p.materia, id: p.id, nombre: p.nombre, ok, segundos: seg, voz: porVoz });
      xp += res.xp;
      let gan = 0;
      if (ok) { racha++; correctas++; gan = Math.round((100 + Math.max(0, LIM - seg) / LIM * 100) * (1 + 0.1 * Math.min(racha - 1, 5)) * (0.8 + 0.2 * p.grado)); puntos += gan; }
      else racha = 0;
      app.querySelectorAll('.opciones button').forEach(b => { if (b.textContent === p.a) b.classList.add('ok'); else if (b.textContent === resp) b.classList.add('mal'); b.disabled = true; });
      if ($('#mic')) $('#mic').remove();
      $('#fb').innerHTML = `<div class="feedback ${ok ? 'si' : 'no'}">${pj('kalipi', ok ? 'celebrar' : 'triste', 52)}<div style="flex:1;text-align:left">
        <b>${ok ? `¡Correcto! +${gan} pts` : resp == null ? '¡Se acabó el tiempo!' : 'Incorrecto'}</b>${!ok ? `<div>Era <b>${esc(p.a)}</b></div>` : ''}
        ${p.explicacion ? `<div class="peq suave">${esc(p.explicacion)}</div>` : ''}</div></div>
        ${datosPais(p) ? '<div id="mapa"></div>' : ''}
        <button class="btn" id="sig" style="margin-top:10px">${i < 11 ? 'Siguiente' : 'Ver resultado'}</button>`;
      if (datosPais(p)) pintarMapa($('#mapa'), ...datosPais(p));
      if (ok) flotante(`+${gan}`);
      avisosPendientes();
      $('#sig').onclick = () => { i++; if (i < pregs.length) pinta(); else terminar(); };
    }
  };
  const terminar = () => {
    limpiar = null;
    const s = S(); const antes = s.recordConcurso || 0; const nuevo = puntos > antes;
    if (nuevo) { s.recordConcurso = puntos; }
    E.registrarSesion({ materia: 'mix', total: 12, correctas, tipo: 'concurso' });
    guardar();
    pantallaResultado({ titulo: nuevo ? `¡Nuevo récord: ${puntos} puntos!` : `${puntos} puntos`, correctas, total: 12, xp,
      extra: `<p class="peq suave">${nuevo ? (antes ? `Superaste tu récord anterior de ${antes}.` : 'Tu primer récord.') : `Tu récord sigue en ${antes} puntos.`}</p>`,
      botones: boton('Jugar otra vez', '#concurso') + boton('Volver', '#estudiar', true) });
  };
  pinta();
}
function marcaVoz(n) { const s = S(); s.recordVoz = Math.max(s.recordVoz || 0, n); guardar(); return s.recordVoz; }

/* ================= Libros ================= */
function vistaLibros() {
  const s = S();
  app.innerHTML = `<div class="vista"><h1 style="margin-bottom:6px">Mis libros</h1>
  <p class="suave peq" style="margin-bottom:14px">Al terminar un libro, la profesora IA te hace un mini examen. Si lo apruebas (4 de 5), ganas +60 XP y queda como comprendido.</p>
  <div class="card"><h2>Agregar libro</h2>
    <input type="text" id="tit" placeholder="Título" style="margin-bottom:8px"><input type="text" id="aut" placeholder="Autor (opcional)">
    <button class="btn" id="add" style="margin-top:10px">Agregar</button></div>
  <div class="lista">${s.libros.slice().reverse().map(l => `
    <div class="card" style="margin:0"><div class="fila entre"><div><h3>${esc(l.titulo)}</h3><p class="peq suave">${esc(l.autor || '')}${l.autor ? ' · ' : ''}${l.comprendido ? `✅ Comprendido ${textoFecha(l.comprendido).toLowerCase()}` : l.estado === 'terminado' ? 'Terminado' : 'Leyendo'}</p>
      ${l.examen ? `<p class="peq suave">Último examen: ${l.examen.correctas}/${l.examen.total}</p>` : ''}</div><span style="font-size:1.6rem">${l.comprendido ? '🦉' : '📘'}</span></div>
      <div class="fila" style="margin-top:10px;flex-wrap:wrap">
        ${l.estado !== 'terminado' ? `<button class="btn chico" data-fin="${l.id}">Lo terminé</button>` : ''}
        ${l.estado === 'terminado' && !l.comprendido ? `<button class="btn chico" data-ex="${l.id}">📝 Mini examen</button>` : ''}
        <button class="btn chico sec" data-del="${l.id}">Quitar</button></div></div>`).join('') || '<p class="suave peq" style="text-align:center">Todavía no hay libros.</p>'}</div>
  </div>${nav('libros')}`;
  $('#add').onclick = () => {
    const t = $('#tit').value.trim(); if (!t) return;
    s.libros.push({ id: Date.now().toString(36), titulo: t, autor: $('#aut').value.trim(), inicio: hoy(), estado: 'leyendo' }); guardar(); render();
  };
  app.querySelectorAll('[data-fin]').forEach(b => b.onclick = () => { const l = s.libros.find(x => x.id === b.dataset.fin); l.estado = 'terminado'; l.fin = hoy(); guardar(); render(); });
  app.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (b.dataset.ok) { s.libros = s.libros.filter(x => x.id !== b.dataset.del); guardar(); render(); } else { b.dataset.ok = 1; b.textContent = '¿Seguro? Toca otra vez'; } });
  app.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => examenDeLibro(s.libros.find(x => x.id === b.dataset.ex)));
}
async function examenDeLibro(l, resumen = '') {
  if (!IA.iaLista()) return toast(`<span>🔌</span><div>${S().ia.key ? 'Necesitas internet para el examen del libro.' : 'Conecta Gemini en Perfil → Ajustes para hacer el examen.'}</div>`);
  app.innerHTML = `<div class="vista"><div class="card" style="text-align:center;margin-top:30px">${pj('leylapi', 'pensando', 100)}<p>Preparando preguntas sobre <b>${esc(l.titulo)}</b>…</p></div></div>`;
  let r;
  try { r = await IA.examenLibro(l.titulo, l.autor, resumen); }
  catch (e) { toast(`<span>⚠️</span><div>${esc(e.message)}</div>`); return render(); }
  if (!r.conoce || r.preguntas.length < 3) {
    app.innerHTML = `<div class="vista">${volver('#libros', 'Libros')}<div class="card" style="margin-top:10px">${pj('leylapi', 'sorpresa', 70)}
      <h2>No conozco bien ese libro</h2><p class="peq">Para no inventar preguntas, cuéntame de qué trata con tus palabras (personajes, ideas principales, cómo termina). Con eso te hago el examen.</p>
      <textarea id="res" rows="7" placeholder="El libro trata de…"></textarea><button class="btn" id="go" style="margin-top:10px">Hacer examen</button></div></div>`;
    $('#go').onclick = () => { const t = $('#res').value.trim(); if (t.split(/\s+/).length < 30) return toast('<span>📝</span><div>Escribe al menos unas 30 palabras.</div>'); examenDeLibro(l, t); };
    return;
  }
  correr({ preguntas: r.preguntas.slice(0, 5), titulo: `📚 ${l.titulo}`, salir: '#libros', alTerminar: res => {
    l.examen = { f: hoy(), correctas: res.correctas, total: res.total };
    const ok = res.correctas >= Math.ceil(res.total * 0.8);
    if (ok) { l.comprendido = hoy(); E.sumarXP(60); E.evento('libro', `Comprendiste “${l.titulo}”.`); }
    E.revisarLogros(); guardar();
    pantallaResultado({ titulo: ok ? '¡Libro comprendido!' : 'Casi lo tienes', correctas: res.correctas, total: res.total, xp: ok ? 60 : 0, extra: `<p class="peq suave">${ok ? `“${esc(l.titulo)}” ya está en tu colección.` : 'Puedes repasar tus notas e intentarlo otro día.'}</p>`, botones: boton('Volver a mis libros', '#libros') });
  } });
}

/* ================= Perfil ================= */
function vistaPerfil() {
  const s = S(); const n = Object.keys(s.logros).length;
  app.innerHTML = `<div class="vista">
    <div style="text-align:center"><div class="fila" style="justify-content:center;gap:0">${pj('leylapi', 'risa', 90)}${pj('kalipi', 'risa', 74)}</div>
    <h1>${esc(s.perfil.nombre || 'Mi perfil')}</h1><p class="suave">${E.nivelDe(s.xp).nombre} · ${s.xp} XP</p></div>
    <div class="card" style="margin-top:14px"><h2>De 0 a Harvard</h2>${tablaGrados()}</div>
    <div class="lista">
      <a href="#logros" class="item" style="text-decoration:none;color:inherit"><span class="ico" style="background:var(--rosa-bg)">🏅</span><div class="cuerpo"><div class="t">Logros</div><div class="peq suave">${n} de ${E.LOGROS.length}</div></div><span>›</span></a>
      <a href="#misiones" class="item" style="text-decoration:none;color:inherit"><span class="ico" style="background:var(--salvia-bg)">🎯</span><div class="cuerpo"><div class="t">Misiones</div><div class="peq suave">Personaliza tus metas diarias</div></div><span>›</span></a>
      <a href="#ajustes" class="item" style="text-decoration:none;color:inherit"><span class="ico" style="background:var(--lavanda-bg)">⚙️</span><div class="cuerpo"><div class="t">Ajustes</div><div class="peq suave">Tema, profesora IA, compañeros y respaldo</div></div><span>›</span></a>
    </div></div>${nav('perfil')}`;
}

/* ================= Misiones ================= */
function vistaMisiones() {
  const s = S(); const mis = E.misionesDeHoy(); const hechas = mis.filter(m => m.hecha).length;
  const activas = s.perfil.misionesActivas || E.MISIONES_DEF;
  app.innerHTML = `<div class="vista">${volver('#perfil', 'Perfil')}<h1 style="margin:6px 0 14px">Misiones de hoy</h1>
  <div class="card heroe"><div class="fila">${anillo(mis.length ? hechas / mis.length : 0, undefined, `<div class="serif" style="font-size:1.5rem">${hechas}/${mis.length}</div>`)}
    <div><h2 style="margin:0 0 4px">${hechas === mis.length ? '¡Día completo!' : 'Paso a paso'}</h2><p class="peq suave">Cada misión da +10 XP y completarlas todas, +20 extra.</p></div></div></div>
  <div class="lista" style="margin-bottom:14px">${mis.map(m => `<div class="item"><span class="check ${m.hecha ? 'si' : ''}">${m.hecha ? '✓' : ''}</span><div class="cuerpo"><div class="t">${esc(m.texto)}</div>
    <div class="barra" style="margin-top:8px;height:7px"><i data-w="${m.prog / m.meta * 100}%"></i></div><div class="peq suave" style="margin-top:4px">${m.prog}/${m.meta}</div></div></div>`).join('')}</div>
  <div class="card"><h2>Personalizar</h2>
    <label class="campo"><span>Misiones por día (aplica desde mañana)</span>
      <div class="seg" id="npd">${[2, 3, 4, 5].map(n => `<button data-v="${n}" class="${(s.perfil.misionesPorDia || 3) === n ? 'on' : ''}">${n}</button>`).join('')}</div></label>
    <div class="lista">${Object.entries(E.PLANTILLAS).map(([id, p]) => `<label class="item" style="cursor:pointer"><div class="cuerpo"><div class="t" style="font-weight:600">${esc(p.texto)}</div></div>
      <span class="interruptor"><input type="checkbox" data-id="${id}" ${activas.includes(id) ? 'checked' : ''}><i></i></span></label>`).join('')}</div>
  </div></div>${nav('perfil')}`;
  $('#npd').onclick = e => { const b = e.target.closest('button'); if (!b) return; s.perfil.misionesPorDia = +b.dataset.v; guardar(); render(); };
  app.querySelectorAll('input[data-id]').forEach(inp => inp.onchange = () => {
    const set = new Set(s.perfil.misionesActivas || activas); inp.checked ? set.add(inp.dataset.id) : set.delete(inp.dataset.id);
    s.perfil.misionesActivas = [...set]; guardar();
  });
}

/* ================= Logros ================= */
function vistaLogros() {
  const s = S(); const n = Object.keys(s.logros).length;
  app.innerHTML = `<div class="vista">${volver('#perfil', 'Perfil')}<h1 style="margin:6px 0 4px">Tu colección</h1>
  <p class="suave peq" style="margin-bottom:14px">${n} de ${E.LOGROS.length} logros desbloqueados</p>
  <div class="rejilla3">${E.LOGROS.map(l => {
    const ok = s.logros[l.id];
    const prog = !ok && l.meta && l.total > 1 ? `<div class="barra" style="height:5px;margin-top:6px"><i data-w="${Math.min(100, l.meta() / l.total * 100)}%"></i></div>` : '';
    return `<div class="logro ${ok ? '' : 'bloq'}"><span class="e">${l.i}</span><div class="t">${esc(l.t)}</div>
      <div class="peq suave" style="font-size:.72rem;margin-top:4px">${ok ? 'Desbloqueado ' + textoFecha(ok).toLowerCase() : esc(l.d)}</div>${prog}</div>`;
  }).join('')}</div>
  <div class="card" style="margin-top:14px"><h2>Niveles de entrenamiento</h2><div class="lista">${E.NIVELES.map((nv, k) => `<div class="fila entre"><span>${k + 1}. ${nv.n}</span><span class="peq ${s.xp >= nv.xp ? '' : 'suave'}">${s.xp >= nv.xp ? '✓' : nv.xp + ' XP'}</span></div>`).join('')}</div>
    <p class="peq suave" style="margin-top:10px">Después de Maestra la progresión continúa. Los niveles son metas de motivación, no una medida de inteligencia.</p></div>
  </div>${nav('perfil')}`;
}

/* ================= Ajustes ================= */
function vistaAjustes() {
  const s = S();
  app.innerHTML = `<div class="vista">${volver('#perfil', 'Perfil')}<h1 style="margin:6px 0 14px">Ajustes</h1>
  <div class="card"><h2>Apariencia</h2>
    <div class="seg" id="tema">${[['claro', '☀️ Claro'], ['oscuro', '🌙 Oscuro'], ['sistema', '📱 Sistema']].map(([v, t]) => `<button data-v="${v}" class="${s.ajustes.tema === v ? 'on' : ''}">${t}</button>`).join('')}</div></div>
  <div class="card"><h2>Profesora IA (Gemini)</h2>
    <p class="peq suave">Gratis desde <b>aistudio.google.com</b> → “Get API key”. Se guarda solo en este celular. Se usa para lecciones nuevas de cultura, explicaciones, revisar tu escritura y los exámenes de libros.</p>
    <label class="campo"><span>API key</span><input type="password" id="key" value="${esc(s.ia.key)}" placeholder="Pega aquí tu key" autocomplete="off"></label>
    <label class="campo"><span>Modelo</span><input type="text" id="modelo" value="${esc(s.ia.modelo)}" list="modelos"><datalist id="modelos"></datalist></label>
    <button class="btn chico" id="probar">Probar conexión</button><div id="estadoIA" class="peq" style="margin-top:8px"></div></div>
  <div class="card"><h2>Perfil y metas</h2>
    <label class="campo"><span>Nombre</span><input type="text" id="nombre" maxlength="30" value="${esc(s.perfil.nombre)}"></label>
    <label class="campo"><span>Días de estudio por semana</span><div class="seg" id="sem">${[3, 4, 5, 6, 7].map(m => `<button data-v="${m}" class="${s.perfil.metaSemanal === m ? 'on' : ''}">${m}</button>`).join('')}</div></label>
    <label class="campo"><span>Días de descanso</span><div class="dias" id="desc">${DIAS_CORTOS.map((d, i) => `<button data-v="${i}" class="${s.perfil.descanso.includes(i) ? 'on' : ''}">${d}</button>`).join('')}</div></label></div>
  <div class="card"><h2>Compañeros de estudio</h2>
    <div class="fila entre"><div class="fila" style="gap:0">${pj('leylapi', 'feliz', 50)}${pj('kalipi', 'feliz', 44)}</div>
      <span class="interruptor"><input type="checkbox" id="masc" ${s.ajustes.mascota ? 'checked' : ''}><i></i></span></div>
    <label class="campo"><span>Nombre de la perrita</span><input type="text" id="n1" maxlength="20" value="${esc(nombreDe('leylapi'))}"></label>
    <label class="campo"><span>Nombre del pollito</span><input type="text" id="n2" maxlength="20" value="${esc(nombreDe('kalipi'))}"></label></div>
  <div class="card"><h2>Tus datos</h2>
    <p class="peq suave">Todo se guarda solo en este dispositivo. Descarga un respaldo de vez en cuando.</p>
    <div class="fila" style="margin-top:10px"><button class="btn chico" id="exp">Descargar respaldo</button><label class="btn chico sec" style="cursor:pointer">Restaurar<input type="file" id="imp" accept=".json,application/json" hidden></label></div>
    <button class="btn chico sec" id="borrar" style="margin-top:14px;color:var(--mal)">Borrar todo mi progreso</button></div>
  <p class="peq suave" style="text-align:center">MENTIS · versión 0.2.6</p>
  </div>${nav('perfil')}`;

  $('#tema').onclick = e => { const b = e.target.closest('button'); if (!b) return; s.ajustes.tema = b.dataset.v; guardar(); render(); };
  $('#key').onchange = e => { s.ia.key = e.target.value.trim(); guardar(); };
  $('#modelo').onchange = e => { s.ia.modelo = e.target.value.trim() || 'gemini-3.6-flash'; guardar(); };
  $('#probar').onclick = async () => {
    s.ia.key = $('#key').value.trim(); s.ia.modelo = $('#modelo').value.trim() || 'gemini-3.6-flash'; guardar();
    const est = $('#estadoIA'); est.textContent = 'Probando…';
    try {
      const ms = await IA.listarModelos(s.ia.key);
      $('#modelos').innerHTML = ms.map(m => `<option value="${esc(m)}">`).join('');
      const existe = ms.includes(s.ia.modelo);
      est.innerHTML = existe ? '✅ Conectado. El modelo está disponible.' : `⚠️ La key funciona, pero “${esc(s.ia.modelo)}” no aparece. Modelos disponibles: ${ms.filter(m => /flash/.test(m)).slice(0, 6).map(esc).join(', ')}`;
    } catch (e) { est.textContent = '❌ ' + e.message; }
  };
  $('#nombre').onchange = e => { s.perfil.nombre = e.target.value.trim(); guardar(); };
  $('#n1').onchange = e => { s.ajustes.nombres.leylapi = e.target.value.trim() || 'Leylapi'; guardar(); };
  $('#n2').onchange = e => { s.ajustes.nombres.kalipi = e.target.value.trim() || 'Kalipi'; guardar(); };
  $('#masc').onchange = e => { s.ajustes.mascota = e.target.checked; guardar(); };
  $('#sem').onclick = e => { const b = e.target.closest('button'); if (!b) return; s.perfil.metaSemanal = +b.dataset.v; guardar(); render(); };
  $('#desc').onclick = e => { const b = e.target.closest('button'); if (!b) return; const v = +b.dataset.v; const d = s.perfil.descanso; s.perfil.descanso = d.includes(v) ? d.filter(x => x !== v) : [...d, v]; guardar(); render(); };
  $('#exp').onclick = () => {
    const blob = new Blob([exportar()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `mentis-respaldo-${hoy()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $('#imp').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { importar(await f.text()); toast('<span>✅</span><b>Respaldo restaurado</b>'); render(); } catch (err) { toast(`<span>⚠️</span><div>${esc(err.message)}</div>`); } };
  $('#borrar').onclick = () => { const b = $('#borrar'); if (b.dataset.seguro) { borrarTodo(); location.hash = ''; render(); return; } b.dataset.seguro = '1'; b.textContent = 'Toca otra vez para confirmar (no se puede deshacer)'; };
}

/* ================= Arranque ================= */
addEventListener('error', e => toast(`<span>⚠️</span><div class="peq">Error: ${esc(e.message)}</div>`, 6000));
addEventListener('unhandledrejection', e => toast(`<span>⚠️</span><div class="peq">Error: ${esc(e.reason?.message || e.reason)}</div>`, 6000));
render();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
