const paragraph = document.getElementById("paragraph");
const textInput = document.getElementById("textInput");
const timer = document.getElementById("timer");
const wpm = document.getElementById("wpm");
const accuracy = document.getElementById("accuracy");
const restart = document.getElementById("restart");
const gameModeBtn = document.getElementById("game-mode");
const fallingWordsDiv = document.getElementById("falling-words");
const accuracyText = document.getElementById("accuracy-text");

const audio = document.getElementById("bg-sound");
const soundBtn = document.getElementById("sound-btn");
const soundIcon = document.getElementById("sound-icon");

let isPlaying = false;

soundBtn.addEventListener("click", ()=>{
  if(isPlaying){
    audio.pause();
    soundIcon.src = "./assets/play.png";
  }
  else{
    audio.play();
    soundIcon.src="./assets/pause.png";
  }
  isPlaying =! isPlaying;
})

let quoteText = '';
let startTime = null;
let timerInterval = null;
let errorCount = 0;

let gameMode = false;
let fallingWords = [];
let lives = 3;


async function getParagraph(){
    try {
      const response = await fetch(
        "http://api.quotable.io/random?minLength=200"
      );
      const data = await response.json();
      return data.content;
    } catch (error) {
      return "The quick brown fox jumps over the lazy dog. The API has failed. Please try again later.";
    }
}

function displayParagraph(par){
    paragraph.innerHTML = par.split('').map(char=> `<span>${char}</span>`).join('');
}

function updateStats(){
  const timeElapsed = (Date.now()- startTime)/1000;
  timer.textContent = Math.floor(timeElapsed);
  const typedLength = textInput.value.length;
  wpm.textContent = Math.floor((typedLength/5)/(timeElapsed/60));
  accuracy.textContent = Math.floor(((typedLength - errorCount)/typedLength)*100) || 0;

  if(gameMode){
    
  }
}

function handleInput(e){
  if(!startTime){
    startTime = Date.now();
    timerInterval = setInterval(updateStats, 1000);
  }
  
  if(gameMode){
  }
  else{
    const quoteSpans = document.querySelectorAll("#paragraph span");
    const inputValue = e.target.value.split("");
    let newErrorCount = 0;

    quoteSpans.forEach((span, index) => {
      const inputChar = inputValue[index];
      if (!inputChar) {
        span.classList.remove("correct", "incorrect");
      } else if (inputChar == span.innerText) {
        span.classList.add("correct");
        span.classList.remove("incorrect");
      } else {
        span.classList.add("incorrect");
        span.classList.remove("correct");
        newErrorCount++;
      }
    });
    errorCount = newErrorCount;

    if (inputValue.length === quoteText.length) {
      clearInterval(timerInterval);
      textInput.disabled = true;
    }
  }
}

async function startTest() {
  startTime =null;
  errorCount = 0;
  clearInterval(timerInterval);
  textInput.value = '';
  textInput.disabled = false;
  timer.textContent = '0';
  wpm.textContent = '0';
  accuracy.textContent = '0';

  if(gameMode){

  }

  quoteText = await getParagraph();
  displayParagraph(quoteText);

  textInput.focus();
  
}

function toggleGameMode(){
  gameMode = !gameMode;
  gameModeBtn.textContent = gameMode ? "Normal Mode" : "Game Mode";
  accuracyText.innerText = gameMode? "Lives:": "Accuracy:";

}

textInput.addEventListener('input', handleInput);
startTest();
restart.addEventListener('click', startTest)
gameModeBtn.addEventListener('click', toggleGameMode);



