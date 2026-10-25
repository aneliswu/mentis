// MENTIS — interfaz
import { S, guardar, hoy, fechaDe, exportar, importar, borrarTodo, pedirPersistencia } from './store.js';
import * as E from './engine.js';
import { HABILIDADES, habilidad, estadoHabilidad, planAdaptativo } from './calculo.js';

const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = x => x == null ? '—' : Math.round(x * 100) + ' %';
const DIAS_CORTOS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const DIAS_NOMBRE = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

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
function anillo(valor, color = 'url(#gradAnillo)', centro = '') {
  const R = 46, C = 2 * Math.PI * R;
  const off = C * (1 - Math.max(0, Math.min(1, valor)));
  return `<div class="anillo"><svg viewBox="0 0 108 108">
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
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colores[i % 4];
    p.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
    p.style.animationDelay = Math.random() * .4 + 's';
    cont.appendChild(p);
  }
  document.body.appendChild(cont);
  setTimeout(() => cont.remove(), 3500);
}
function toast(html, ms = 3200) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html;
  document.body.appendChild(t); setTimeout(() => t.remove(), ms);
}
function flotante(texto) {
  const f = document.createElement('div'); f.className = 'flotante'; f.textContent = texto;
  document.body.appendChild(f); setTimeout(() => f.remove(), 1000);
}
function avisosPendientes() {
  const cola = [];
  const nivel = E.tomarSubidaDeNivel();
  if (nivel) cola.push(`<span style="font-size:1.6rem">🎓</span><div><b>¡Nuevo nivel: ${nivel.nombre}!</b><div class="peq suave">Tu esfuerzo se nota.</div></div>`);
  E.tomarLogrosRecien().forEach(l => cola.push(`<span style="font-size:1.6rem">${l.i}</span><div><b>Logro: ${esc(l.t)}</b><div class="peq suave">${esc(l.d)}</div></div>`));
  E.tomarMisionesRecien().forEach(m => cola.push(`<span style="font-size:1.6rem">🎯</span><div><b>Misión cumplida</b><div class="peq suave">${esc(m)} · +10 XP</div></div>`));
  if (cola.length) confeti();
  cola.forEach((h, i) => setTimeout(() => toast(h), i * 1800));
}

/* ================= Navegación ================= */
const TABS = [
  ['inicio', '🏡', 'Inicio'], ['estudiar', '📚', 'Estudiar'], ['misiones', '🎯', 'Misiones'], ['logros', '🏅', 'Logros'], ['ajustes', '⚙️', 'Ajustes'],
];
function nav(actual) {
  return `<nav class="abajo">${TABS.map(([id, i, t]) => `<a href="#${id}" class="${actual === id ? 'on' : ''}"><span class="i">${i}</span>${t}</a>`).join('')}</nav>`;
}
function render() {
  aplicarTema();
  if (!S().perfil) return vistaBienvenida();
  const [ruta, arg] = (location.hash.slice(1) || 'inicio').split('/');
  const vistas = { inicio: vistaInicio, estudiar: vistaEstudiar, calculo: vistaCalculo, sesion: () => vistaSesion(arg), misiones: vistaMisiones, logros: vistaLogros, ajustes: vistaAjustes };
  (vistas[ruta] || vistaInicio)();
  window.scrollTo(0, 0);
  animarEntrada();
}
addEventListener('hashchange', render);

/* ================= Bienvenida ================= */
function vistaBienvenida() {
  const borrador = { nombre: '', metaMinutos: 15, misionesPorDia: 3, metaSemanal: 5, descanso: [0] };
  app.innerHTML = `<div class="vista">
    <div style="text-align:center;margin:20px 0 10px">
      <img src="mascota.png" alt="" style="width:130px;animation:respirar 4s ease-in-out infinite">
      <h1 style="margin-top:10px">Bienvenida a MENTIS</h1>
      <p class="suave">Tu academia personal. Aquí cada punto, nivel y racha sale de lo que de verdad aprendes.</p>
    </div>
    <div class="card">
      <label class="campo"><span>¿Cómo te llamo?</span><input type="text" id="nombre" maxlength="30" placeholder="Tu nombre"></label>
      <label class="campo"><span>Minutos de estudio al día</span>
        <div class="seg" id="min">${[10, 15, 25, 40].map(m => `<button data-v="${m}" class="${m === 15 ? 'on' : ''}">${m}</button>`).join('')}</div></label>
      <label class="campo"><span>Días que quieres estudiar por semana</span>
        <div class="seg" id="sem">${[3, 4, 5, 6, 7].map(m => `<button data-v="${m}" class="${m === 5 ? 'on' : ''}">${m}</button>`).join('')}</div></label>
      <label class="campo"><span>Días de descanso (no rompen tu racha)</span>
        <div class="dias" id="desc">${DIAS_CORTOS.map((d, i) => `<button data-v="${i}" class="${i === 0 ? 'on' : ''}" title="${DIAS_NOMBRE[i]}">${d}</button>`).join('')}</div></label>
      <button class="btn" id="empezar" style="margin-top:8px">Empezar</button>
    </div></div>`;
  const seg = (id, key) => $('#' + id).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $('#' + id).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); borrador[key] = +b.dataset.v;
  });
  seg('min', 'metaMinutos'); seg('sem', 'metaSemanal');
  $('#desc').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    b.classList.toggle('on'); const v = +b.dataset.v;
    borrador.descanso = b.classList.contains('on') ? [...borrador.descanso, v] : borrador.descanso.filter(x => x !== v);
  });
  $('#empezar').onclick = () => {
    borrador.nombre = $('#nombre').value.trim();
    S().perfil = borrador; guardar(); pedirPersistencia(); location.hash = 'inicio'; render();
  };
}

/* ================= Inicio ================= */
function vistaInicio() {
  const s = S(); const st = E.estadisticas(); const nv = st.nivel;
  const progNivel = (s.xp - nv.desde) / (nv.hasta - nv.desde);
  const mis = E.misionesDeHoy(); const hechas = mis.filter(m => m.hecha).length;
  const minHoy = Math.round(st.hoy.segundos / 60);
  const minTxt = st.hoy.segundos > 0 && minHoy === 0 ? '<1' : minHoy;
  const metaMin = s.perfil.metaMinutos;
  const fechaTxt = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const maxXp = Math.max(30, ...st.semana7.map(d => d.xp));

  app.innerHTML = `<div class="vista">
  <div class="saludo"><div><div class="fecha">${fechaTxt}</div><h1>Hola${s.perfil.nombre ? ', ' + esc(s.perfil.nombre) : ''}</h1></div>
    <span class="chip lavanda">Nivel ${nv.num}</span></div>

  ${s.ajustes.mascota ? `<div class="mascota"><img src="mascota.png" alt="${esc(s.ajustes.nombreMascota)}"><div class="globo">${esc(E.mensajeMascota())}</div></div>` : ''}

  <div class="card heroe">
    <div class="fila">
      ${anillo(progNivel, undefined, `<div><div class="etiqueta">Nivel</div><div class="serif" style="font-size:1.6rem">${nv.num}</div></div>`)}
      <div style="flex:1">
        <div class="etiqueta">Tu nivel de entrenamiento</div>
        <h2 style="margin:2px 0 6px">${nv.nombre}</h2>
        <div class="barra"><i data-w="${progNivel * 100}%"></i></div>
        <p class="peq suave">${s.xp - nv.desde} / ${nv.hasta - nv.desde} XP para <b>${nv.siguiente}</b></p>
      </div>
    </div>
  </div>

  <div class="rejilla2">
    <div class="card"><div class="etiqueta">Hoy</div>
      <div class="fila" style="margin-top:6px">${anillo(Math.min(1, minHoy / metaMin), 'var(--salvia)', `<div><div class="serif" style="font-size:1.3rem">${minTxt}</div><div class="etiqueta">de ${metaMin} min</div></div>`).replace('class="anillo"', 'class="anillo" style="width:84px;height:84px"')}</div>
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

  <div class="rejilla2">
    <div class="card"><div class="etiqueta">Conceptos dominados</div><div class="num">${st.dominados}</div></div>
    <div class="card"><div class="etiqueta">Ejercicios</div><div class="num">${st.ejercicios}</div><p class="peq suave">Precisión ${pct(st.precisionTotal)}</p></div>
  </div>

  <div class="card"><h2>Actividad de la semana</h2>
    <div class="barras7">${st.semana7.map(d => `<div class="col ${d.f === hoy() ? 'hoy' : ''}"><div class="b"><i data-h="${d.xp / maxXp * 100}%"></i></div><span class="d">${DIAS_CORTOS[fechaDe(d.f).getDay()]}</span></div>`).join('')}</div>
    <p class="peq suave" style="margin-top:8px">XP ganada por día</p>
  </div>

  <div class="card"><h2>Últimos 30 días</h2>
    ${calendario30(st.mes30)}
    <p class="peq suave" style="margin-top:8px">Un día cuenta como estudiado desde ${E.UMBRAL_DIA} XP.</p>
  </div>

  <div class="card"><h2>Precisión y retención</h2>${graficaPrecision(st.semanas)}</div>

  <div class="card"><h2>Próximos repasos</h2>
    ${st.proximos.length ? `<div class="lista">${st.proximos.slice(0, 5).map(p => `<div class="item"><span class="ico" style="background:var(--lavanda-bg)">${E.MATERIAS[p.m]?.icono || '•'}</span><div class="cuerpo"><div class="t">${esc(p.nombre)}</div><div class="peq suave">${textoFecha(p.prox)}</div></div></div>`).join('')}</div>`
      : '<p class="suave peq">Aparecerán cuando practiques. MENTIS te recordará cada concepto justo antes de que se te olvide.</p>'}
  </div>

  <div class="card"><h2>Tus materias</h2>${fortalezas(st)}</div>

  ${st.hitos.length ? `<div class="card"><h2>Hitos recientes</h2><div class="lista">${st.hitos.map(h => `<div class="item"><span class="ico" style="background:var(--rosa-bg)">${{ dominio: '⭐', nivel: '🎓', logro: '🏅', misiones: '🎯', regreso: '🌤️' }[h.tipo]}</span><div class="cuerpo"><div class="t" style="font-weight:600">${esc(h.texto)}</div><div class="peq suave">${textoFecha(h.f)}</div></div></div>`).join('')}</div></div>` : ''}

  </div>${nav('inicio')}`;
}

function textoFecha(f) {
  const d = Math.round((fechaDe(f) - fechaDe(hoy())) / 86400000);
  if (d === 0) return 'Hoy'; if (d === 1) return 'Mañana'; if (d === -1) return 'Ayer';
  if (d > 1) return `En ${d} días`; return `Hace ${-d} días`;
}
function calendario30(mes) {
  // alinear a lunes
  const primero = fechaDe(mes[0].f); const huecos = (primero.getDay() + 6) % 7;
  const cab = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<span style="background:none;font-weight:800">${d}</span>`).join('');
  return `<div class="calendario">${cab}${'<span style="background:none"></span>'.repeat(huecos)}${mes.map(d => {
    const n = d.xp === 0 ? '' : d.xp < E.UMBRAL_DIA ? 'n1' : d.xp < 60 ? 'n2' : 'n3';
    return `<span class="${n} ${d.f === hoy() ? 'hoy' : ''}" title="${d.f}: ${d.xp} XP">${fechaDe(d.f).getDate()}</span>`;
  }).join('')}</div>`;
}
function graficaPrecision(semanas) {
  const pts = semanas.map((s, i) => ({ x: i, y: s.p }));
  const conDatos = pts.filter(p => p.y != null);
  if (conDatos.length < 2) return '<p class="suave peq">Necesito al menos dos semanas con práctica para mostrar tu tendencia real.</p>';
  const W = 300, H = 80, X = i => 10 + i * (W - 20) / 7, Y = v => H - 8 - v * (H - 16);
  const d = conDatos.map((p, k) => `${k ? 'L' : 'M'}${X(p.x)},${Y(p.y)}`).join(' ');
  return `<div class="linea"><svg viewBox="0 0 ${W} ${H}"><path d="${d}" fill="none" stroke="var(--lavanda)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${conDatos.map(p => `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="4" fill="var(--rosa)"/>`).join('')}</svg></div>
    <p class="peq suave">Precisión semanal (8 semanas). Última: ${pct(conDatos.at(-1).y)}</p>`;
}
function fortalezas(st) {
  const habs = st.porConcepto.filter(c => c.p != null).sort((a, b) => b.p - a.p);
  if (!habs.length) return '<p class="suave peq">Cuando practiques al menos 5 ejercicios de una habilidad, aquí verás tus puntos fuertes y lo que conviene reforzar.</p>';
  const fuertes = habs.filter(h => h.p >= 0.8).slice(0, 3);
  const flojas = habs.filter(h => h.p < 0.7).slice(-3).reverse();
  return `${st.porMateria.map(m => `<div class="fila entre" style="margin-bottom:8px"><span>${E.MATERIAS[m.m].icono} ${E.MATERIAS[m.m].nombre}</span><span class="chip salvia">${pct(m.p)}</span></div>`).join('')}
    <div class="etiqueta" style="margin-top:6px">Lo más fuerte</div>
    <p class="peq">${fuertes.length ? fuertes.map(h => `${esc(h.nombre)} (${pct(h.p)})`).join(' · ') : 'Todavía nada sobre 80 %. ¡Ya llegará!'}</p>
    <div class="etiqueta" style="margin-top:6px">Para reforzar</div>
    <p class="peq">${flojas.length ? flojas.map(h => `${esc(h.nombre)} (${pct(h.p)})`).join(' · ') : 'Nada por debajo de 70 %. 👏'}</p>`;
}

/* ================= Estudiar ================= */
function vistaEstudiar() {
  app.innerHTML = `<div class="vista"><h1 style="margin-bottom:14px">Estudiar</h1>
  <div class="lista">${Object.entries(E.MATERIAS).map(([id, m]) => `
    <a ${m.lista ? `href="#${id}"` : ''} class="item" style="text-decoration:none;color:inherit;${m.lista ? '' : 'opacity:.55'}">
      <span class="ico" style="background:var(--${m.color}-bg)">${m.icono}</span>
      <div class="cuerpo"><div class="t">${m.nombre}</div><div class="peq suave">${m.lista ? resumenMateria(id) : 'Próximamente'}</div></div>
      ${m.lista ? '<span class="suave">›</span>' : ''}
    </a>`).join('')}</div></div>${nav('estudiar')}`;
}
function resumenMateria(id) {
  const cs = Object.values(S().conceptos).filter(c => c.m === id);
  const dom = cs.filter(c => c.dominado).length;
  return cs.length ? `${dom} dominadas de ${cs.length} practicadas` : 'Aún sin empezar';
}

function vistaCalculo() {
  const pend = HABILIDADES.filter(h => estadoHabilidad(h).estado === 'repaso').length;
  const etiquetas = { nueva: ['Nueva', 'durazno'], practica: ['En práctica', 'lavanda'], repaso: ['Repaso hoy', 'rosa'], dominada: ['Dominada', 'salvia'] };
  app.innerHTML = `<div class="vista">
  <a href="#estudiar" class="suave" style="text-decoration:none">‹ Estudiar</a>
  <h1 style="margin:6px 0 4px">🧮 Cálculo mental</h1>
  <p class="suave peq" style="margin-bottom:14px">Una habilidad se domina con 80 % de aciertos en días distintos y espaciados, no en una sola sentada.</p>
  <div class="card heroe">
    <h2>Sesión adaptativa</h2>
    <p class="peq suave">10 ejercicios. ${pend ? `Incluye tus ${pend} ${pend === 1 ? 'repaso pendiente' : 'repasos pendientes'}.` : 'Elige lo que más te conviene practicar ahora.'}</p>
    <a class="btn" href="#sesion/mix" style="display:block;text-align:center;text-decoration:none;margin-top:10px">Empezar</a>
  </div>
  <div class="lista">${HABILIDADES.map(h => {
    const e = estadoHabilidad(h); const [t, c] = etiquetas[e.estado];
    return `<a href="#sesion/${h.id}" class="item" style="text-decoration:none;color:inherit">
      <div class="cuerpo"><div class="t">${h.nombre}</div><div class="peq suave">Nivel ${h.nivel}${e.p != null ? ' · precisión reciente ' + pct(e.p) : ''}</div></div>
      <span class="chip ${c}">${t}</span></a>`;
  }).join('')}</div></div>${nav('estudiar')}`;
}

/* ================= Sesión de ejercicios ================= */
function vistaSesion(arg) {
  const N = 10;
  const plan = arg === 'mix' ? planAdaptativo(N) : Array(N).fill(habilidad(arg));
  if (!plan[0]) { location.hash = 'calculo'; return; }
  let i = 0, entrada = '', inicio = performance.now(), resultados = [], xpSesion = 0, bloqueado = false;
  let actual = plan[0].gen();

  app.innerHTML = `<div class="vista">
    <div class="fila entre"><a href="#calculo" class="suave" style="text-decoration:none">✕ Salir</a><span class="chip lavanda" id="xpS">+0 XP</span></div>
    <div class="card ejercicio">
      <div class="puntos" id="puntos">${plan.map(() => '<i></i>').join('')}</div>
      <div class="peq suave" id="hab" style="margin-top:14px"></div>
      <div class="pregunta" id="preg"></div>
      <div class="respuesta" id="resp">&nbsp;</div>
      <div class="peq suave" id="fb">&nbsp;</div>
      <div class="teclado">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}
        <button data-k="⌫">⌫</button><button data-k="0">0</button><button data-k="ok" class="ir">✓</button></div>
    </div></div>`;

  const pinta = () => {
    $('#puntos').querySelectorAll('i').forEach((p, k) => p.className = k < resultados.length ? (resultados[k] ? 'ok' : 'mal') : k === i ? 'act' : '');
    $('#hab').textContent = plan[i].nombre;
    $('#preg').textContent = actual.q;
    const r = $('#resp'); r.className = 'respuesta'; r.textContent = entrada || ' ';
    $('#fb').innerHTML = '&nbsp;';
  };
  const responder = () => {
    if (!entrada || bloqueado) return;
    bloqueado = true;
    const seg = (performance.now() - inicio) / 1000;
    const ok = Number(entrada) === actual.a;
    const res = E.registrarIntento({ materia: 'calculo', id: plan[i].id, nombre: plan[i].nombre, ok, segundos: seg });
    resultados.push(ok); xpSesion += res.xp;
    $('#xpS').textContent = `+${xpSesion} XP`;
    const r = $('#resp'); r.classList.add(ok ? 'ok' : 'mal');
    $('#fb').innerHTML = ok ? (res.motivos.length ? esc(res.motivos.join(' · ')) : '¡Correcto!') : `La respuesta era <b>${actual.a}</b>`;
    if (res.xp) flotante(`+${res.xp} XP`);
    if (res.nuevoDominio) confeti();
    avisosPendientes();
    setTimeout(() => {
      i++; entrada = ''; bloqueado = false;
      if (i >= N) return fin();
      actual = plan[i].gen(); inicio = performance.now(); pinta();
    }, ok ? 650 : 1500);
  };
  const tecla = k => {
    if (bloqueado) return;
    if (k === 'ok') return responder();
    if (k === '⌫') entrada = entrada.slice(0, -1);
    else if (entrada.length < 6) entrada += k;
    $('#resp').textContent = entrada || ' ';
  };
  app.querySelector('.teclado').addEventListener('click', e => { const b = e.target.closest('button'); if (b) tecla(b.dataset.k); });
  const teclado = e => {
    if (!location.hash.startsWith('#sesion')) return removeEventListener('keydown', teclado);
    if (/^\d$/.test(e.key)) tecla(e.key); else if (e.key === 'Backspace') tecla('⌫'); else if (e.key === 'Enter') tecla('ok');
  };
  addEventListener('keydown', teclado);

  const fin = () => {
    removeEventListener('keydown', teclado);
    const correctas = resultados.filter(Boolean).length;
    const bono = E.registrarSesion({ materia: 'calculo', total: N, correctas });
    xpSesion += bono.xp;
    if (correctas >= 8) confeti();
    app.innerHTML = `<div class="vista" style="text-align:center">
      ${S().ajustes.mascota ? `<div class="mascota feliz" style="justify-content:center"><img src="mascota.png" alt=""></div>` : ''}
      <h1>${correctas >= 8 ? '¡Excelente sesión!' : correctas >= 5 ? '¡Buen trabajo!' : 'Cada error también enseña'}</h1>
      <div class="card" style="margin-top:14px">
        <div class="fila" style="justify-content:center">${anillo(correctas / N, undefined, `<div><div class="serif" style="font-size:1.6rem">${correctas}/${N}</div><div class="etiqueta">correctas</div></div>`)}</div>
        <p style="margin-top:10px"><b>+${xpSesion} XP</b>${bono.motivos.length ? ` · ${bono.motivos.join(' · ')}` : ''}</p>
        ${correctas < 5 ? '<p class="peq suave">Las habilidades que fallaste volverán pronto en tus repasos para afianzarlas.</p>' : ''}
      </div>
      <a class="btn" href="#sesion/${arg}" style="display:block;text-decoration:none;margin-bottom:10px">Otra sesión</a>
      <a class="btn sec" href="#inicio" style="display:block;text-decoration:none">Volver al inicio</a>
    </div>`;
    animarEntrada(); avisosPendientes();
  };
  pinta();
}

/* ================= Misiones ================= */
function vistaMisiones() {
  const s = S(); const mis = E.misionesDeHoy(); const hechas = mis.filter(m => m.hecha).length;
  const activas = s.perfil.misionesActivas || ['calc10', 'calcSesion', 'repasos', 'nueva', 'precision'];
  app.innerHTML = `<div class="vista"><h1 style="margin-bottom:14px">Misiones de hoy</h1>
  <div class="card heroe"><div class="fila">${anillo(mis.length ? hechas / mis.length : 0, undefined, `<div><div class="serif" style="font-size:1.5rem">${hechas}/${mis.length}</div></div>`)}
    <div><h2 style="margin:0 0 4px">${hechas === mis.length ? '¡Día completo!' : 'Paso a paso'}</h2><p class="peq suave">Cada misión da +10 XP y completarlas todas, +20 extra.</p></div></div></div>
  <div class="lista" style="margin-bottom:14px">${mis.map(m => `<div class="item"><span class="check ${m.hecha ? 'si' : ''}">${m.hecha ? '✓' : ''}</span><div class="cuerpo"><div class="t">${esc(m.texto)}</div>
    <div class="barra" style="margin-top:8px;height:7px"><i data-w="${m.prog / m.meta * 100}%"></i></div><div class="peq suave" style="margin-top:4px">${m.prog}/${m.meta}</div></div></div>`).join('')}</div>
  <div class="card"><h2>Personalizar</h2>
    <label class="campo"><span>Misiones por día (aplica desde mañana)</span>
      <div class="seg" id="npd">${[2, 3, 4, 5].map(n => `<button data-v="${n}" class="${(s.perfil.misionesPorDia || 3) === n ? 'on' : ''}">${n}</button>`).join('')}</div></label>
    <div class="etiqueta" style="margin:10px 0 6px">Tipos de misión</div>
    <div class="lista">${Object.entries(E.PLANTILLAS).map(([id, p]) => `<label class="item" style="cursor:pointer;${p.disponible() || id === 'repasos' ? '' : 'opacity:.5'}"><div class="cuerpo"><div class="t" style="font-weight:600">${esc(p.texto)}</div>${p.disponible() || id === 'repasos' ? '' : '<div class="peq suave">Se activa con su materia</div>'}</div>
      <span class="interruptor"><input type="checkbox" data-id="${id}" ${activas.includes(id) ? 'checked' : ''} ${p.disponible() || id === 'repasos' ? '' : 'disabled'}><i></i></span></label>`).join('')}</div>
  </div></div>${nav('misiones')}`;
  $('#npd').onclick = e => { const b = e.target.closest('button'); if (!b) return; s.perfil.misionesPorDia = +b.dataset.v; guardar(); vistaMisiones(); animarEntrada(); };
  app.querySelectorAll('input[data-id]').forEach(inp => inp.onchange = () => {
    const set = new Set(s.perfil.misionesActivas || activas);
    inp.checked ? set.add(inp.dataset.id) : set.delete(inp.dataset.id);
    s.perfil.misionesActivas = [...set]; guardar();
  });
}

/* ================= Logros ================= */
function vistaLogros() {
  const s = S(); const n = Object.keys(s.logros).length;
  app.innerHTML = `<div class="vista"><h1 style="margin-bottom:4px">Tu colección</h1>
  <p class="suave peq" style="margin-bottom:14px">${n} de ${E.LOGROS.length} logros desbloqueados</p>
  <div class="rejilla3">${E.LOGROS.map(l => {
    const ok = s.logros[l.id];
    const prog = !ok && l.meta && l.total > 1 ? `<div class="barra" style="height:5px;margin-top:6px"><i data-w="${Math.min(100, l.meta() / l.total * 100)}%"></i></div>` : '';
    return `<div class="logro ${ok ? '' : 'bloq'}"><span class="e">${l.i}</span><div class="t">${esc(l.t)}</div>
      <div class="peq suave" style="font-size:.72rem;margin-top:4px">${ok ? 'Desbloqueado ' + textoFecha(ok).toLowerCase() : l.fase ? 'Próximamente' : esc(l.d)}</div>${prog}</div>`;
  }).join('')}</div>
  <div class="card" style="margin-top:14px"><h2>Niveles</h2><div class="lista">${E.NIVELES.map((nv, k) => `<div class="fila entre"><span>${k + 1}. ${nv.n}</span><span class="peq ${s.xp >= nv.xp ? '' : 'suave'}">${s.xp >= nv.xp ? '✓' : nv.xp + ' XP'}</span></div>`).join('')}</div>
    <p class="peq suave" style="margin-top:10px">Después de Maestra la progresión continúa. Los niveles son metas de motivación, no una medida de inteligencia.</p></div>
  </div>${nav('logros')}`;
}

/* ================= Ajustes ================= */
function vistaAjustes() {
  const s = S();
  app.innerHTML = `<div class="vista"><h1 style="margin-bottom:14px">Ajustes</h1>
  <div class="card"><h2>Apariencia</h2>
    <div class="seg" id="tema">${[['claro', '☀️ Claro'], ['oscuro', '🌙 Oscuro'], ['sistema', '📱 Sistema']].map(([v, t]) => `<button data-v="${v}" class="${s.ajustes.tema === v ? 'on' : ''}">${t}</button>`).join('')}</div></div>
  <div class="card"><h2>Perfil y metas</h2>
    <label class="campo"><span>Nombre</span><input type="text" id="nombre" maxlength="30" value="${esc(s.perfil.nombre)}"></label>
    <label class="campo"><span>Minutos de estudio al día</span><div class="seg" id="min">${[10, 15, 25, 40].map(m => `<button data-v="${m}" class="${s.perfil.metaMinutos === m ? 'on' : ''}">${m}</button>`).join('')}</div></label>
    <label class="campo"><span>Días de estudio por semana</span><div class="seg" id="sem">${[3, 4, 5, 6, 7].map(m => `<button data-v="${m}" class="${s.perfil.metaSemanal === m ? 'on' : ''}">${m}</button>`).join('')}</div></label>
    <label class="campo"><span>Días de descanso</span><div class="dias" id="desc">${DIAS_CORTOS.map((d, i) => `<button data-v="${i}" class="${s.perfil.descanso.includes(i) ? 'on' : ''}">${d}</button>`).join('')}</div></label>
  </div>
  <div class="card"><h2>Compañero de estudio</h2>
    <div class="fila entre"><div class="fila"><img src="mascota.png" alt="" style="width:44px"><span>Mostrar a ${esc(s.ajustes.nombreMascota)}</span></div>
      <span class="interruptor"><input type="checkbox" id="masc" ${s.ajustes.mascota ? 'checked' : ''}><i></i></span></div>
    <label class="campo"><span>Nombre del compañero</span><input type="text" id="nmasc" maxlength="20" value="${esc(s.ajustes.nombreMascota)}"></label>
  </div>
  <div class="card"><h2>Tus datos</h2>
    <p class="peq suave">Todo se guarda solo en este dispositivo. Descarga un respaldo de vez en cuando.</p>
    <div class="fila" style="margin-top:10px"><button class="btn chico" id="exp">Descargar respaldo</button><label class="btn chico sec" style="cursor:pointer">Restaurar<input type="file" id="imp" accept=".json,application/json" hidden></label></div>
    <button class="btn chico sec" id="borrar" style="margin-top:14px;color:var(--mal)">Borrar todo mi progreso</button>
  </div>
  <p class="peq suave" style="text-align:center">MENTIS · versión 0.1 (fase 1)</p>
  </div>${nav('ajustes')}`;

  $('#tema').onclick = e => { const b = e.target.closest('button'); if (!b) return; s.ajustes.tema = b.dataset.v; guardar(); vistaAjustes(); aplicarTema(); };
  $('#nombre').onchange = e => { s.perfil.nombre = e.target.value.trim(); guardar(); };
  $('#nmasc').onchange = e => { s.ajustes.nombreMascota = e.target.value.trim() || 'Coco'; guardar(); };
  $('#masc').onchange = e => { s.ajustes.mascota = e.target.checked; guardar(); };
  const seg = (id, key) => $('#' + id).onclick = e => { const b = e.target.closest('button'); if (!b) return; s.perfil[key] = +b.dataset.v; guardar(); vistaAjustes(); };
  seg('min', 'metaMinutos'); seg('sem', 'metaSemanal');
  $('#desc').onclick = e => { const b = e.target.closest('button'); if (!b) return; const v = +b.dataset.v; const d = s.perfil.descanso; s.perfil.descanso = d.includes(v) ? d.filter(x => x !== v) : [...d, v]; guardar(); vistaAjustes(); };
  $('#exp').onclick = () => {
    const blob = new Blob([exportar()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `mentis-respaldo-${hoy()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $('#imp').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { importar(await f.text()); toast('<span>✅</span><b>Respaldo restaurado</b>'); render(); }
    catch (err) { toast(`<span>⚠️</span><div>${esc(err.message)}</div>`); }
  };
  $('#borrar').onclick = () => {
    const b = $('#borrar');
    if (b.dataset.seguro) { borrarTodo(); location.hash = ''; render(); return; }
    b.dataset.seguro = '1'; b.textContent = 'Toca otra vez para confirmar (no se puede deshacer)';
    setTimeout(() => { if (b.isConnected) { delete b.dataset.seguro; b.textContent = 'Borrar todo mi progreso'; } }, 4000);
  };
}

/* ================= Arranque ================= */
render();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
