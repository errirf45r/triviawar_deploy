let allQuestions = [];
let questions = [];
let currentQuestionIndex = 0;
let totalTime = 20;
let timeLeft = totalTime;
let timerInterval = null;
let score = 0;
let partitaInCorso = false;
let punteggioPartita = 0;
const questionsPerRound = 5; // Numero di domande per round

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
  // Mescola le domande
  domandeCategoria.sort(() => Math.random() - 0.5);
  // Prendi solo le prime questionsPerRound domande
  questions = domandeCategoria.slice(0, questionsPerRound);
  // Randomizza le risposte per ogni domanda
  questions.forEach(q => {
    q.risposte.sort(() => Math.random() - 0.5);
  });
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
    answerFeedback.classList.add("correct");
  } else {
    btn.style.background = 'var(--wrong)';
    answerFeedback.textContent = "SBAGLIATO";
    answerFeedback.classList.add("wrong");
  }

  highlightCorrect(risposte);
  setTimeout(nextQuestion,5000);
}

// Evidenzia risposta corretta
function highlightCorrect(risposte){
  risposte.forEach((r,i) => {
    if(r.corretta){ answerBtns[i].style.background='var(--correct)'; }
  });
}

// Timer
function startTimer(){
  timeLeft = totalTime;
  timerBar.style.width='100%';
  timerInterval = setInterval(()=>{
    timeLeft -= 0.1;
    let percent = Math.max(timeLeft/totalTime*100,0);
    timerBar.style.width = percent + '%';
    if(timeLeft <= 0){
      clearInterval(timerInterval);
      handleTimeout();
    }
  },100);
}

// Timeout risposta
function handleTimeout(){
  disableAnswers();
  answerFeedback.textContent = "SBAGLIATO";
  answerFeedback.className = "feedback wrong";
  highlightCorrect(questions[currentQuestionIndex].risposte);
  setTimeout(nextQuestion,1000);
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

// Fine quiz
function fineQuiz() {
  if (partitaInCorso) {
    punteggioPartita += score;
    const datiPartita = {
      attiva: true,
      punteggio: punteggioPartita,
      timestamp: new Date().getTime()
    };
    localStorage.setItem("partitaInCorso", JSON.stringify(datiPartita));
  }

  // 🔹 Pulisce completamente le risposte precedenti
  const answersDiv = document.querySelector(".answers");
  answersDiv.innerHTML = "";

  // 🔹 Mostra la schermata finale centrata e pulita
  questionTextEl.innerHTML = `
    <div class="score-text" style="text-align:center; display:flex; flex-direction:column; align-items:center; gap:0.8rem;">
      <div>Round: <span>${score} 👑</span></div>
      ${
        partitaInCorso
          ? `<div style="text-align:center;">Punteggio totale: <span>${punteggioPartita} 👑</span></div>`
          : ""
      }
      <div>Categoria: ${selectedCategory}</div>
    </div>

    <div class="info-box">
      ${
        partitaInCorso
          ? "Torna alla ruota per continuare la partita!"
          : "Partita conclusa! Torna alla ruota per iniziare una nuova partita."
      }
    </div>

    <div class="final-buttons" style="display:flex; flex-direction:row; justify-content:center; align-items:center; gap:1.5rem; flex-wrap:wrap; margin-top:1.5rem;">
      <button class="finish-btn" onclick="window.location.href='../Html/Ruota.html'">Torna alla Ruota</button>
      <button class="finish-btn" style="background:linear-gradient(135deg,#ff6b6b,#c44569)" onclick="concludiPartita()">Esci dal Gioco</button>
    </div>
  `;

  questionImage.style.display = "none";
  timerBar.style.width = "0%";
  displayScoreHistory();
}



// Concludi partita e cancella stato
function concludiPartita() {
  if (partitaInCorso && punteggioPartita > 0) {
    addScoreToHistory(punteggioPartita, 'Partita Completa', new Date().toLocaleString('it-IT'));
  }
  localStorage.removeItem('partitaInCorso');
  window.location.href = "../index.html";
}

// Cronologia punteggi
function addScoreToHistory(score, category, date) {
  let scoreHistory = JSON.parse(localStorage.getItem('quizScoreHistory') || '[]');
  scoreHistory.unshift({ score: score, category: category, date: date || new Date().toLocaleString('it-IT'), totalQuestions: questions.length });
  if (scoreHistory.length > 10) { scoreHistory = scoreHistory.slice(0, 10); }
  localStorage.setItem('quizScoreHistory', JSON.stringify(scoreHistory));
}

// Mostra cronologia
function displayScoreHistory() {
  let scoreHistory = JSON.parse(localStorage.getItem('quizScoreHistory') || '[]');
  const historyContainer = document.createElement('div');
  historyContainer.className = 'score-history';
  historyContainer.innerHTML = `<h3>📊 Le tue ultime partite:</h3> ${scoreHistory.length > 0 ? `<ul> ${scoreHistory.map(entry => `<li> <span>${entry.category}: ${entry.score} punti</span> <span style="font-size:0.8rem; color:#ffffffaa;">${entry.date}</span> </li>` ).join('')} </ul> <button class="finish-btn clear-scores" onclick="clearScoreHistory()">Cancella Cronologia</button>` : '<p>Nessuna partita precedente</p>'}`;
  const answersDiv = document.querySelector('.answers');
  if (answersDiv && answersDiv.parentNode) { answersDiv.parentNode.insertBefore(historyContainer, answersDiv.nextSibling); }
}

// Cancella cronologia
function clearScoreHistory() {
  if (confirm('Sei sicuro di voler cancellare tutta la cronologia dei punteggi?')) {
    localStorage.removeItem('quizScoreHistory');
    const historyContainer = document.querySelector('.score-history');
    if (historyContainer) { historyContainer.remove(); }
    displayScoreHistory();
  }
}

const closeBtn = document.getElementById("close-btn");

if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    localStorage.removeItem('partitaInCorso');
    window.location.href = "../index.html";
  });
}

