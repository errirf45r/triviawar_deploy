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
const feedbackDelay = 2500; // ← cambia qui se vuoi più o meno tempo

const questionTextEl = document.getElementById('question-text');
const answerBtns = document.querySelectorAll('.answer-btn');
const timerBar = document.getElementById('timer-bar');
const questionImage = document.getElementById('question-image');
const answerFeedback = document.getElementById('answer-feedback');

// Carica stato partita dal localStorage
function caricaStatoPartita() {
  const partitaSalvata = localStorage.getItem('partitaInCorso');
  if (partitaSalvata) {
    const datiPartita = JSON.parse(partitaSalvata);
    partitaInCorso = datiPartita.attiva;
    punteggioPartita = datiPartita.punteggio || 0;
  }
}

// Carica tutte le domande dal XML
const selectedCategory = localStorage.getItem('categoria') || 'Storia';
let xmlText = document.getElementById('domande-xml').textContent;
let data = (new DOMParser()).parseFromString(xmlText, "text/xml");
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

// Seleziona le domande per il round corrente
function selezionaDomandeRound() {
  let domandeCategoria = allQuestions.filter(d => d.categoria === selectedCategory);
  domandeCategoria.sort(() => Math.random() - 0.5);
  questions = domandeCategoria.slice(0, questionsPerRound);
  questions.forEach(q => q.risposte.sort(() => Math.random() - 0.5));
}

caricaStatoPartita();
selezionaDomandeRound();
showQuestion();

// Mostra domanda corrente
function showQuestion(){
  answerFeedback.textContent = "";
  answerFeedback.className = "feedback";
  answerBtns.forEach(btn => btn.classList.remove("selected"));

  if(currentQuestionIndex >= questions.length){
    fineQuiz();
    return;
  }

  let q = questions[currentQuestionIndex];
  questionTextEl.textContent = q.testo;

  if(q.image){
    questionImage.src = q.image;
    questionImage.style.display = "block";
  } else {
    questionImage.style.display = "none";
  }

  answerBtns.forEach((btn,i) => {
    let r = q.risposte[i];
    btn.textContent = r.text;
    btn.disabled = false;
    btn.style.background = 'var(--btn-gradient)';
    btn.onclick = () => selezionaRisposta(btn, r, q.risposte);
  });

  startTimer();
}

// Gestione selezione risposta
function selezionaRisposta(btn, risposta, risposte){
  clearInterval(timerInterval);
  disableAnswers();
  btn.classList.add("selected");

  if(risposta.corretta){
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

  setTimeout(nextQuestion, feedbackDelay);
}

// Evidenzia risposta corretta
function highlightCorrect(risposte){
  risposte.forEach((r,i) => {
    if(r.corretta){
      answerBtns[i].style.background = 'var(--correct)';
    }
  });
}

// Timer
function startTimer(){
  timeLeft = totalTime;
  timerBar.style.width = '100%';

  timerInterval = setInterval(() => {
    timeLeft -= 0.1;
    let percent = Math.max(timeLeft / totalTime * 100, 0);
    timerBar.style.width = percent + '%';

    if(timeLeft <= 0){
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 100);
}

// Timeout risposta
function handleTimeout(){
  disableAnswers();
  answerFeedback.textContent = "SBAGLIATO";
  answerFeedback.className = "feedback wrong";

  highlightCorrect(questions[currentQuestionIndex].risposte);

  setTimeout(nextQuestion, feedbackDelay);
}

// Disabilita pulsanti risposte
function disableAnswers(){
  answerBtns.forEach(b => b.disabled = true);
}

// Passa alla domanda successiva
function nextQuestion(){
  currentQuestionIndex++;
  showQuestion();
}

// Fine quiz (INALTERATA)
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
    <div class="score-text" style="text-align:center;">
      <div>Round: <span>${score} 👑</span></div>
      ${partitaInCorso ? `<div>Punteggio totale: <span>${punteggioPartita} 👑</span></div>` : ""}
      <div>Categoria: ${selectedCategory}</div>
    </div>
  `;

  questionImage.style.display = "none";
  timerBar.style.width = "0%";
  displayScoreHistory();
}
