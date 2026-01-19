const ruota = document.getElementById('ruota');
const btn = document.getElementById('giraBtn');
const risultato = document.getElementById('risultato');

const immagini = ruota.querySelectorAll('.ruota img');

const settori = [
  { nome: "Re", start: 0, end: 90, centro: 45 },
  { nome: "Storia", start: 90, end: 180, centro: 135 },
  { nome: "Guerra", start: 180, end: 270, centro: 225 },
  { nome: "Geografia", start: 270, end: 360, centro: 315 }
];

// ================== FRASI CASUALI ==================
const frasiCasuali = [
  "💡Dimostra quanto ne sai",
  "🤔 Chissà quale categoria uscirà…",
  "🔥 Pronto per la prossima sfida?",
  "🍀 Incrocia le dita e gira!",
  "⚡ Un nuovo round sta per iniziare!",
  "✅Pronto per un nuovo round!",
  "🎯Tocca a te! Sei pronto?"

];

function mostraFraseCasuale() {
  const frase = frasiCasuali[Math.floor(Math.random() * frasiCasuali.length)];
  risultato.innerHTML = `<span style="opacity:.85">${frase}</span>`;
}

// ================== STATO PARTITA ==================
let rotazioneTot = 0;
let partitaInCorso = false;
let punteggioPartita = 0;

// ================== UTILITY ==================
function normalizza360(a) {
  return ((a % 360) + 360) % 360;
}

function trovaSettoreDaAngolo(ang) {
  for (const s of settori) {
    if (s.start <= ang && ang < s.end) return s;
  }
  return settori[0];
}

// ================== GESTIONE PARTITA ==================
function controllaPartitaInCorso() {
  const partitaSalvata = localStorage.getItem('partitaInCorso');
  if (partitaSalvata) {
    const datiPartita = JSON.parse(partitaSalvata);
    partitaInCorso = datiPartita.attiva;
    punteggioPartita = datiPartita.punteggio || 0;

    if (partitaInCorso) aggiornaDisplayPunteggio();
  }
}

function salvaStatoPartita() {
  const datiPartita = {
    attiva: partitaInCorso,
    punteggio: punteggioPartita,
    timestamp: Date.now()
  };
  localStorage.setItem('partitaInCorso', JSON.stringify(datiPartita));
}

function iniziaNuovaPartita() {
  partitaInCorso = true;
  punteggioPartita = 0;
  salvaStatoPartita();
  aggiornaDisplayPunteggio();
}

function aggiornaDisplayPunteggio() {
  let punteggioDiv = document.getElementById('punteggio');
  if (!punteggioDiv) {
    punteggioDiv = document.createElement('div');
    punteggioDiv.id = 'punteggio';
    punteggioDiv.style.cssText = `
      margin-top: 1rem;
      font-weight: 700;
      color: gold;
      text-shadow: 0 0 8px rgba(255,215,0,0.8);
      animation: fadeCountdown 0.8s ease;
    `;
    risultato.appendChild(punteggioDiv);
  }
  punteggioDiv.innerHTML = `🎯 Punteggio: ${punteggioPartita}`;
}

// ================== LOGICA RUOTA ==================
btn.addEventListener('click', () => {
  btn.disabled = true;
  mostraFraseCasuale();
  risultato.style.color = "#ffffff";

  if (!partitaInCorso) iniziaNuovaPartita();

  const scelto = settori[Math.floor(Math.random() * settori.length)];
  const rotTarget = normalizza360(360 - scelto.centro);
  const giriFissi = 6 * 360;
  rotazioneTot += giriFissi + rotTarget;

  ruota.style.transition = "transform 4s cubic-bezier(0.25, 1, 0.5, 1)";
  ruota.style.transform = `rotate(${rotazioneTot}deg)`;

  immagini.forEach(img => {
    img.style.transition = "transform 4s cubic-bezier(0.25, 1, 0.5, 1)";
    img.style.transform = `rotate(${-rotazioneTot}deg)`;
  });

  setTimeout(() => {
    const angleAtTop = normalizza360(rotazioneTot);
    const finalSector = trovaSettoreDaAngolo(360 - angleAtTop);

    risultato.innerHTML = `
      <span id="categoria">
        Categoria: ${finalSector.nome}${finalSector.nome === "Re" ? " 👑" : ""}
      </span>
      <span id="countdown"></span>
    `;

    aggiornaDisplayPunteggio();
    localStorage.setItem('categoria', finalSector.nome);
    salvaStatoPartita();

    let tempo = 3;
    const countdownSpan = document.getElementById('countdown');

    const interval = setInterval(() => {
      if (tempo > 0) {
        countdownSpan.textContent = tempo;
      } else {
        countdownSpan.textContent = "VIA!";
        countdownSpan.classList.add('via');
        clearInterval(interval);
        setTimeout(() => {
          window.location.href = "../Html/Domande.html";
        }, 1000);
      }
      tempo--;
    }, 1000);
  }, 4300);
});

// ================== AVVIO ==================
document.addEventListener('DOMContentLoaded', () => {
  controllaPartitaInCorso();
  mostraFraseCasuale();
});
