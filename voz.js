// MENTIS — voz: leer en voz alta (sin internet) y escuchar respuestas (Chrome necesita internet)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const puedeEscuchar = () => !!SR;

let vozEs = null;
function elegirVoz() {
  const vs = speechSynthesis.getVoices();
  vozEs = vs.find(v => v.lang === 'es-MX') || vs.find(v => v.lang?.startsWith('es-US')) || vs.find(v => v.lang?.startsWith('es')) || null;
}
if ('speechSynthesis' in window) { elegirVoz(); speechSynthesis.onvoiceschanged = elegirVoz; }

export function hablar(texto) {
  return new Promise(res => {
    if (!('speechSynthesis' in window)) return res();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto.replace(/−/g, ' menos ').replace(/×/g, ' por ').replace(/÷/g, ' entre '));
    u.lang = 'es-MX'; if (vozEs) u.voice = vozEs; u.rate = 1.02;
    u.onend = res; u.onerror = res;
    speechSynthesis.speak(u);
    setTimeout(res, 9000);
  });
}

export function escuchar() {
  return new Promise((res, rej) => {
    if (!SR) return rej(new Error('Este navegador no permite reconocimiento de voz.'));
    const r = new SR();
    r.lang = 'es-MX'; r.interimResults = false; r.maxAlternatives = 4; r.continuous = false;
    let listo = false;
    r.onresult = e => { listo = true; res([...e.results[0]].map(a => a.transcript)); };
    r.onerror = e => { if (!listo) rej(new Error(e.error === 'no-speech' ? 'No te escuché.' : e.error === 'not-allowed' ? 'Permite el micrófono para jugar.' : e.error === 'network' ? 'El reconocimiento de voz necesita internet.' : 'No te entendí.')); };
    r.onend = () => { if (!listo) rej(new Error('No te escuché.')); };
    r.start();
  });
}

// "veinticinco" → 25, "menos tres" → -3, "125" → 125
const NUM = { cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500, seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900 };
export function aNumero(texto) {
  const t = texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/,/g, '.');
  const d = t.match(/-?\d+(\.\d+)?/);
  if (d) return Number(d[0]) * (/menos/.test(t) && !d[0].startsWith('-') ? -1 : 1);
  let total = 0, actual = 0, hay = false, neg = false;
  for (const w of t.split(/[\s-]+/)) {
    if (w === 'menos' || w === 'negativo') { neg = true; continue; }
    if (w === 'y') continue;
    if (w === 'mil') { actual = (actual || 1) * 1000; total += actual; actual = 0; hay = true; continue; }
    if (w in NUM) { actual += NUM[w]; hay = true; }
  }
  if (!hay) return null;
  return (total + actual) * (neg ? -1 : 1);
}
