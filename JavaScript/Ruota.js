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

// ⏱ TEMPO DI VISUALIZZAZIONE VERDE / ROSSO
const feedbackDelay = 2500;

const questionTextEl = document.getElementById('question-text');
const answerBtns = document.querySelectorAll('.answer-btn');
const timerBar = document.getElementById('timer-bar');
const questionImage = document.getElementById('question-image');
const answerFeedback = document.getElementById('answer-feedback');

// ------------------ STATO PARTITA ------------------
function caricaStatoPartita() {
  const partitaSalvata = localStorage.getItem('partitaInCorso');
  if (partitaSalvata) {
    const datiPartita = JSON.parse(partitaSalvata);
    partitaInCorso = datiPartita.attiva;
    punteggioPartita = datiPartita.punteggio || 0;
  }
}

// ------------------ CARICAMENTO DOMANDE ------------------
const selectedCategory = localStorage.getItem('categoria') || 'Storia';
let xmlText = document.getElementById('domande-xml').textContent;
let data = new DOMParser().parseFromString(xmlText, "text/xml");
let domandeXml = data.querySelectorAll('domanda');

domandeXml.forEach(d => {
  let risposte = Array.from(d.querySelectorAll('risposta')).map(r => ({
    text: r.textContent,
    corretta: r.getAttribute('corretta') === "true"
  }));

  allQuestions.push({
    categoria: d.getAttribute('categoria'),
    testo: d.querySelector('testo').textContent,
    image: d.querySelector('image').textContent,
    valore: parseInt(d.getAttribute('valore')),
    risposte: risposte
  });
});

// ------------------ SELEZIONE DOMANDE ------------------
function selezionaDomandeRound() {
  let domandeCategoria = allQuestions.filter(d => d.categoria === selectedCategory);
  domandeCategoria.sort(() => Math.random() - 0.5);
  questions = domandeCategoria.slice(0, questionsPerRound);
  questions.forEach(q => q.risposte.sort(() => Math.random() - 0.5));
}

caricaStatoPartita();
selezionaDomandeRound();
showQuestion();

// ------------------ MOSTRA DOMANDA ------------------
function showQuestion() {
  answerFeedback.textContent = "";
  answerFeedback.className = "feedback";
  answerBtns.forEach(btn => btn.classList.remove("selected"));

  if (currentQuestionIndex >= questions.length) {
    fineQuiz();
    return;
  }

  let q = questions[currentQuestionIndex];
  questionTextEl.textContent = q.testo;

  if (q.image) {
    questionImage.src = q.image;
    questionImage.style.display = "block";
  } else {
    questionImage.style.display = "none";
  }

  answerBtns.forEach((btn, i) => {
    let r = q.risposte[i];
    btn.textContent = r.text;
    btn.disabled = false;
    btn.style.background = 'var(--btn-gradient)';
    btn.onclick = () => selezionaRisposta(btn, r, q.risposte);
  });

  startTimer();
}

// ------------------ SELEZIONE RISPOSTA ------------------
function selezionaRisposta(btn, risposta, risposte) {
  clearInterval(timerInterval);
  disableAnswers();
  btn.classList.add("selected");

  if (risposta.corretta) {
    btn.style.background = 'var(--correct)';
    score += questions[currentQuestionIndex].valore;
    answerFeedback.textContent = "CORRETTO";
    answerFeedback.className = "feedback correct";
  } else {
    btn.style.background = 'var(--wrong)';
    answerFeedback.textContent = "SBAGLIATO";
    answerFeedback.className = "feedback wrong";
  }

  highlightCorrect(risposte);

  setTimeout(() => {
    nextQuestion();
  }, feedbackDelay);
}

// ------------------ EVIDENZIA CORRETTA ------------------
function highlightCorrect(risposte) {
  risposte.forEach((r, i) => {
    if (r.corretta) {
      answerBtns[i].style.background = 'var(--correct)';
    }
  });
}

// ------------------ TIMER ------------------
function startTimer() {
  timeLeft = totalTime;
  timerBar.style.width = '100%';

  timerInterval = setInterval(() => {
    timeLeft -= 0.1;
    let percent = Math.max(timeLeft / totalTime * 100, 0);
    timerBar.style.width = percent + '%';

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 100);
}

// ------------------ TIMEOUT ------------------
function handleTimeout() {
  disableAnswers();
  answerFeedback.textContent = "SBAGLIATO";
  answerFeedback.className = "feedback wrong";

  highlightCorrect(questions[currentQuestionIndex].risposte);

  setTimeout(() => {
    nextQuestion();
  }, feedbackDelay);
}

// ------------------ UTIL ------------------
function disableAnswers() {
  answerBtns.forEach(b => b.disabled = true);
}

function nextQuestion() {
  currentQuestionIndex++;
  showQuestion();
}

// ------------------ FINE QUIZ ------------------
function fineQuiz() {
  if (partitaInCorso) {
    punteggioPartita += score;
    localStorage.setItem("partitaInCorso", JSON.stringify({
      attiva: true,
      punteggio: punteggioPartita,
      timestamp: new Date().getTime()
    }));
  }

  document.querySelector(".answers").innerHTML = "";

  questionTextEl.innerHTML = `
    <div class="score-text" style="text-align:center">
      <div>Round: <span>${score} 👑</span></div>
      ${partitaInCorso ? `<div>Punteggio totale: <span>${punteggioPartita} 👑</span></div>` : ""}
      <div>Categoria: ${selectedCategory}</div>
    </div>
    <div class="info-box">
      ${partitaInCorso ? "Torna alla ruota per continuare!" : "Partita conclusa!"}
    </div>
    <div class="final-buttons">
      <button class="finish-btn" onclick="window.location.href='../Html/Ruota.html'">Torna alla Ruota</button>
      <button class="finish-btn" onclick="concludiPartita()">Esci</button>
    </div>
  `;

  questionImage.style.display = "none";
  timerBar.style.width = "0%";
  displayScoreHistory();
}

// ------------------ USCITA ------------------
function concludiPartita() {
  if (partitaInCorso && punteggioPartita > 0) {
    addScoreToHistory(punteggioPartita, 'Partita Completa');
  }
  localStorage.removeItem('partitaInCorso');
  window.location.href = "../index.html";
}

// ------------------ CRONOLOGIA ------------------
function addScoreToHistory(score, category) {
  let history = JSON.parse(localStorage.getItem('quizScoreHistory') || '[]');
  history.unshift({ score, category, date: new Date().toLocaleString('it-IT') });
  history = history.slice(0, 10);
  localStorage.setItem('quizScoreHistory', JSON.stringify(history));
}

function displayScoreHistory() {
  let history = JSON.parse(localStorage.getItem('quizScoreHistory') || '[]');
  const div = document.createElement('div');
  div.className = 'score-history';
  div.innerHTML = `<h3>📊 Ultime partite</h3>
    ${history.length ? `<ul>${history.map(h => `<li>${h.category}: ${h.score} (${h.date})</li>`).join('')}</ul>` : '<p>Nessuna partita</p>'}`;
  document.querySelector('.answers').after(div);
}

// ------------------ CHIUSURA ------------------
const closeBtn = document.getElementById("close-btn");
if (closeBtn) {
  closeBtn.onclick = () => {
    localStorage.removeItem('partitaInCorso');
    window.location.href = "../index.html";
  };
}
