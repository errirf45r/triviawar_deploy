let allQuestions = [];
let questions = [];
let currentQuestionIndex = 0;
let totalTime = 20;
let timeLeft = totalTime;
let timerInterval = null;
let score = 0;
let partitaInCorso = false;
let punteggioPartita = 0;

const questionsPerRound = 5;

const questionTextEl = document.getElementById("question-text");
const answerBtns = document.querySelectorAll(".answer-btn");
const timerBar = document.getElementById("timer-bar");
const questionImage = document.getElementById("question-image");
const answerFeedback = document.getElementById("answer-feedback");

/* ===============================
   STATO PARTITA
================================ */
function caricaStatoPartita() {
  const partitaSalvata = localStorage.getItem("partitaInCorso");
  if (partitaSalvata) {
    const dati = JSON.parse(partitaSalvata);
    partitaInCorso = dati.attiva;
    punteggioPartita = dati.punteggio || 0;
  }
}

/* ===============================
   CARICAMENTO DOMANDE XML
================================ */
const selectedCategory = localStorage.getItem("categoria") || "Storia";

const xmlText = document.getElementById("domande-xml").textContent;
const xmlDoc = new DOMParser().parseFromString(xmlText, "text/xml");
const domandeXml = xmlDoc.querySelectorAll("domanda");

domandeXml.forEach(d => {
  const risposte = Array.from(d.querySelectorAll("risposta")).map(r => ({
    text: r.textContent,
    corretta: r.getAttribute("corretta") === "true"
  }));

  allQuestions.push({
    categoria: d.getAttribute("categoria"),
    testo: d.querySelector("testo").textContent,
    image: d.querySelector("image")?.textContent || "",
    valore: parseInt(d.getAttribute("valore")),
    risposte: risposte
  });
});

/* ===============================
   SELEZIONE DOMANDE ROUND
================================ */
function selezionaDomandeRound() {
  const filtrate = allQuestions.filter(d => d.categoria === selectedCategory);
  filtrate.sort(() => Math.random() - 0.5);
  questions = filtrate.slice(0, questionsPerRound);
  questions.forEach(q => q.risposte.sort(() => Math.random() - 0.5));
}

/* ===============================
   MOSTRA DOMANDA
================================ */
function showQuestion() {
  answerFeedback.textContent = "";
  answerFeedback.className = "feedback";

  answerBtns.forEach(btn => {
    btn.classList.remove("selected");
    btn.disabled = false;
    btn.style.background = "var(--btn-gradient)";
  });

  if (currentQuestionIndex >= questions.length) {
    fineQuiz();
    return;
  }

  const q = questions[currentQuestionIndex];
  questionTextEl.textContent = q.testo;

  if (q.image) {
    questionImage.src = q.image;
    questionImage.style.display = "block";
  } else {
    questionImage.style.display = "none";
  }

  answerBtns.forEach((btn, i) => {
    const r = q.risposte[i];
    btn.textContent = r.text;
    btn.onclick = () => selezionaRisposta(btn, r, q.risposte);
  });

  startTimer();
}

/* ===============================
   RISPOSTA
================================ */
function selezionaRisposta(btn, risposta, risposte) {
  clearInterval(timerInterval);
  disabilitaRisposte();
  btn.classList.add("selected");

  if (risposta.corretta) {
    btn.style.background = "var(--correct)";
    score += questions[currentQuestionIndex].valore;
    answerFeedback.textContent = "CORRETTO";
    answerFeedback.classList.add("correct");
  } else {
    btn.style.background = "var(--wrong)";
    answerFeedback.textContent = "SBAGLIATO";
    answerFeedback.classList.add("wrong");
  }

  evidenziaCorretta(risposte);
  setTimeout(nextQuestion, 1000);
}

function evidenziaCorretta(risposte) {
  risposte.forEach((r, i) => {
    if (r.corretta) {
      answerBtns[i].style.background = "var(--correct)";
    }
  });
}

/* ===============================
   TIMER
================================ */
function startTimer() {
  timeLeft = totalTime;
  timerBar.style.width = "100%";

  timerInterval = setInterval(() => {
    timeLeft -= 0.1;
    const percent = Math.max((timeLeft / totalTime) * 100, 0);
    timerBar.style.width = percent + "%";

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timeout();
    }
  }, 100);
}

function timeout() {
  disabilitaRisposte();
  answerFeedback.textContent = "SBAGLIATO";
  answerFeedback.className = "feedback wrong";
  evidenziaCorretta(questions[currentQuestionIndex].risposte);
  setTimeout(nextQuestion, 1000);
}

function disabilitaRisposte() {
  answerBtns.forEach(btn => (btn.disabled = true));
}

/* ===============================
   AVANZA
================================ */
function nextQuestion() {
  currentQuestionIndex++;
  showQuestion();
}

/* ===============================
   FINE QUIZ
================================ */
function fineQuiz() {
  if (partitaInCorso) {
    punteggioPartita += score;
    localStorage.setItem(
      "partitaInCorso",
      JSON.stringify({
        attiva: true,
        punteggio: punteggioPartita,
        timestamp: Date.now()
      })
    );
  }

  document.querySelector(".answers").innerHTML = "";

  questionTextEl.innerHTML = `
    <div class="score-text">
      <div>Round: <span>${score} 👑</span></div>
      ${partitaInCorso ? `<div>Punteggio totale: <span>${punteggioPartita} 👑</span></div>` : ""}
      <div>Categoria: ${selectedCategory}</div>
    </div>

    <div class="info-box">
      ${partitaInCorso ? "Torna alla ruota per continuare la partita!" : "Partita conclusa!"}
    </div>

    <div class="final-buttons">
      <button class="finish-btn" onclick="location.href='../Html/Ruota.html'">Torna alla Ruota</button>
      <button class="finish-btn" onclick="concludiPartita()">Esci</button>
    </div>
  `;

  questionImage.style.display = "none";
  timerBar.style.width = "0%";

  mostraCronologia();
}

/* ===============================
   PARTITA & CRONOLOGIA
================================ */
function concludiPartita() {
  if (partitaInCorso && punteggioPartita > 0) {
    aggiungiCronologia(punteggioPartita, "Partita Completa");
  }
  localStorage.removeItem("partitaInCorso");
  location.href = "../index.html";
}

function aggiungiCronologia(score, category) {
  let history = JSON.parse(localStorage.getItem("quizScoreHistory") || "[]");
  history.unshift({
    score,
    category,
    date: new Date().toLocaleString("it-IT")
  });
  history = history.slice(0, 10);
  localStorage.setItem("quizScoreHistory", JSON.stringify(history));
}

function mostraCronologia() {
  const history = JSON.parse(localStorage.getItem("quizScoreHistory") || "[]");
  const div = document.createElement("div");
  div.className = "score-history";

  div.innerHTML = history.length
    ? `<h3>📊 Ultime partite</h3>
       <ul>${history
         .map(h => `<li>${h.category}: ${h.score} — ${h.date}</li>`)
         .join("")}</ul>`
    : "<p>Nessuna partita precedente</p>";

  document.body.appendChild(div);
}

/* ===============================
   AVVIO
================================ */
caricaStatoPartita();
selezionaDomandeRound();
showQuestion();
