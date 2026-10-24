const paragraph = document.getElementById("paragraph");
const textInput = document.getElementById("textInput");
const timer = document.getElementById("timer");
const wpm = document.getElementById("wpm");
const accuracy = document.getElementById("accuracy");
const restart = document.getElementById("restart");
const gameModeBtn = document.getElementById("game-mode");
const fallingWordsContainer = document.getElementById("falling-words");
const accuracyContainer = document.querySelector(".accuracy-container");
const livesContainer = document.getElementById("lives-container");
const livesHearts = document.getElementById("lives-hearts");
const paragraphDisplay = document.getElementById("paragraph-display");
const congratulationsCard = document.getElementById("congratulations-card");
const gameOverCard = document.getElementById("game-over-card");
const resultCard = document.getElementById("result-card");
const finalTime = document.getElementById("final-time");
const finalWpm = document.getElementById("final-wpm");
const finalAccuracy = document.getElementById("final-accuracy");
const resultRestart = document.getElementById("result-restart");
const lengthButtons = document.querySelectorAll(".length-btn");
const instructionCard = document.getElementById("instruction-card");
const gameStartBtn = document.getElementById("game-start");
const gameOverRestart = document.getElementById("game-over-restart");
const congratsWords = document.getElementById("congrats-words");
const congratsMissed = document.getElementById("congrats-missed");
const congratsRestart = document.getElementById("congrats-restart");
const congratsNormalMode = document.getElementById("congrats-normal-mode");
const gameOverWords = document.getElementById("game-over-words");
const gameOverMissed = document.getElementById("game-over-missed");
const gameOverNormalMode = document.getElementById("game-over-normal-mode");
const loadingIndicator = document.getElementById("loading-indicator");

let quoteText = "";

// swimming fish
const FISH_SOURCES = [
  "./assets/fish/yellow_fish.webp",
  "./assets/fish/long_fish.webp",
  "./assets/fish/blue_fish.webp",
];

function randomFishSource() {
  return FISH_SOURCES[Math.floor(Math.random() * FISH_SOURCES.length)];
}

// top is relative to the seabed
const fishConfigs = [
  { size: 130, top: "30%", swim: 30, bob: 6.0, amp: 40, delay: -3, opacity: 0.8, blur: 0, layer: "back" },
  { size: 112, top: "46%", swim: 34, bob: 5.6, amp: 36, delay: -14, opacity: 0.81, blur: 0, layer: "back" },
  { size: 100, top: "-4%", swim: 38, bob: 5.0, amp: 32, delay: -21, opacity: 0.83, blur: 0.4, layer: "front" },
  { size: 86, top: "6%", swim: 44, bob: 4.3, amp: 26, delay: -40, opacity: 0.93, blur: 0.8, layer: "front" },
  { size: 74, top: "2%", swim: 48, bob: 4.0, amp: 22, delay: -34, opacity: 0.9, blur: 1.2, layer: "front" },
];

const fishLayers = {
  back: document.getElementById("fish-layer-back"),
  front: document.getElementById("fish-layer-front"),
};

function createFish(cfg) {
  const fish = document.createElement("div");
  fish.className = "fish";
  fish.setAttribute("aria-hidden", "true");
  fish.style.setProperty("--size", `${cfg.size}px`);
  fish.style.setProperty("--top", cfg.top);
  fish.style.setProperty("--swim", `${cfg.swim}s`);
  fish.style.setProperty("--bob", `${cfg.bob}s`);
  fish.style.setProperty("--amp", `${cfg.amp}px`);
  fish.style.setProperty("--delay", `${cfg.delay}s`);
  fish.style.setProperty("--opacity", cfg.opacity);
  fish.style.setProperty("--blur", `${cfg.blur}px`);

  const bob = document.createElement("div");
  bob.className = "fish-bob";

  const img = document.createElement("img");
  img.className = "fish-body";
  img.src = cfg.src || randomFishSource();
  img.alt = "";

  bob.appendChild(img);
  fish.appendChild(bob);
  (fishLayers[cfg.layer] || fishLayers.front).appendChild(fish);
}

fishConfigs.forEach(createFish);

// sentence length control
const lengthRanges = {
  short: { min: 20, max: 80 },
  medium: { min: 120, max: 180 },
  long: { min: 250, max: 300 },
};
let lengthMode = "medium";

// !background sound
const audio = document.getElementById("bg-sound");
const soundBtn = document.getElementById("sound-btn");
const soundIcon = document.getElementById("sound-icon");
const successSound = document.getElementById("success-sound");
const missedSound = document.getElementById("missed-sound");

function playEffect(soundType){
  soundType.currentTime = 0;
  soundType.play().catch(()=>{});
}

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
});

// !game mode

let startTime = null;
let timerInterval = null;
let errorCount = 0;

let gameMode = false;
let fallingWords = [];
let gameWords = [];
let lives = 5;
let score = 0;
let gameSpeed = 1;
let currentIndex = 0;
let wordSpawnInterval = null;
let gameAnimation = null;
let missedCount = 0;
let gameActive = false;

const MAX_LIVES = 5;

function renderLives(animateLast) {
  livesHearts.innerHTML = "";
  for (let i = 0; i < MAX_LIVES; i++) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = "\u2764\uFE0E";
    if (i >= lives) heart.classList.add("lost");
    if (animateLast && i === lives) heart.classList.add("pulse");
    livesHearts.appendChild(heart);
  }
}


async function getParagraph(){
    try {
      const { min, max } = lengthRanges[lengthMode];
      const apiBase =
        location.protocol === "https:" ? "/api" : "http://api.quotable.io";
      const response = await fetch(
        `${apiBase}/random?minLength=${min}&maxLength=${max}`
      );
      const data = await response.json();
      return data.content;
    } catch (error) {
      return "The quick brown fox jumps over the lazy dog. The API has failed. Please try again later.";
    }
}

function displayParagraph(par) {
  paragraph.innerHTML = par
    .split("")
    .map((char) => `<span>${char}</span>`)
    .join("");
}

function showLoading() {
  loadingIndicator.classList.remove("hidden");
  paragraph.classList.add("hidden");
  textInput.disabled = true;
}

function hideLoading() {
  loadingIndicator.classList.add("hidden");
  paragraph.classList.remove("hidden");
  textInput.disabled = false;
}

async function getGameWords() {
  const text = await getParagraph();
  const cleanWords = text
    .split(" ")
    .map((word) => word.toLowerCase().replace(/[.,!?;:"-_+=()]/g, ""))
    .filter((word) => word.length > 0);
  return cleanWords;
}

function createFallingWordDiv(word){
  const wordElement = document.createElement("div");
  wordElement.className = "falling-word";
  wordElement.textContent = word;
  wordElement.style.left = `${Math.random() * (window.innerWidth - 150)}px`;
  wordElement.style.top = "-50px";
  document.body.appendChild(wordElement);
  return wordElement;
}

function generateWord(){
  if(currentIndex < gameWords.length && lives > 0){
    const word = gameWords[currentIndex];
    const wordElement = createFallingWordDiv(word);
    fallingWords.push({
      element: wordElement,
      word: word,
      y: -50,
      speed: gameSpeed,
      hasReachedBottom: false
    });
    currentIndex ++;

  }
}

function removeFallingWord(wordObj){
  const index = fallingWords.indexOf(wordObj);
  if(index !== -1){
    fallingWords.splice(index,1);
  }
  wordObj.element.remove();
  checkGameCompletion();
}

function checkGameCompletion(){
  if(!gameActive) return;
  const allSpawned = currentIndex >= gameWords.length;
  if(allSpawned && fallingWords.length === 0){
    endGameWithSuccess();
  }
}

function updateFallingWords(){
  for(let i = fallingWords.length - 1; i>=0; i--){
    const wordObj = fallingWords[i];
    if(wordObj.hasReachedBottom) continue;

    wordObj.y = wordObj.y + wordObj.speed;
    wordObj.element.style.top = `${wordObj.y}px`;

    if(wordObj.y > window.innerHeight * 0.40 && !wordObj.element.classList.contains('water')){
      wordObj.element.classList.add("water");
    }

    if(wordObj.y > window.innerHeight - 50){
      wordObj.hasReachedBottom = true;
      lives = lives - 1;
      missedCount++;
      playEffect(missedSound);
      renderLives(true);
      wordObj.element.classList.add("missed");
      setTimeout(()=>{
        removeFallingWord(wordObj);
      }, 500);

      if(lives <=0){
        endGameWithFailure();
      }
    }
  }
}

function checkTypedWord(){
  const typedWord = textInput.value.trim();

  for(let i = 0; i<fallingWords.length; i++){
    const wordObj = fallingWords[i];
    if(wordObj.hasReachedBottom) continue;
    if(wordObj.word === typedWord){
      score++;
      playEffect(successSound);
      wordObj.element.classList.add("matched");

      setTimeout(()=>{
        removeFallingWord(wordObj);
      }, 200);

      gameSpeed +=0.1;
      break;
    }
  }

  textInput.value = '';
}

function gameLoop(){
  if(gameMode && lives >0){
    updateFallingWords();
    gameAnimation = requestAnimationFrame(gameLoop);
  }
}

function clearAll(){
  clearInterval(timerInterval);
  clearInterval(wordSpawnInterval);
  cancelAnimationFrame(gameAnimation);
}

function endGameWithSuccess(){
  if(!gameActive) return;
  gameActive = false;
  clearAll();
  textInput.disabled=true;
  fallingWords.forEach((wordObj)=> wordObj.element.remove());
  fallingWords=[];
  congratsWords.textContent = `${score}/${gameWords.length}`;
  congratsMissed.textContent = missedCount;
  congratulationsCard.classList.remove('hidden');
}

function endGameWithFailure(){
  if(!gameActive) return;
  gameActive = false;
  clearAll();
  textInput.disabled = true;
  gameOverWords.textContent = `${score}/${gameWords.length}`;
  gameOverMissed.textContent = missedCount;
  gameOverCard.classList.remove("hidden");
  fallingWords.forEach((wordObj) => wordObj.element.remove());
  fallingWords = [];
}

function updateStats(){
  const timeElapsed = (Date.now()- startTime)/1000;
  timer.textContent = Math.floor(timeElapsed);
  const typedLength = textInput.value.length;


  if(gameMode){
    wpm.textContent = Math.floor(score/(timeElapsed/60)) || 0;
  }
  else{
    wpm.textContent = Math.floor(typedLength / 5 / (timeElapsed / 60));
    accuracy.textContent = `${
      Math.floor(((typedLength - errorCount) / typedLength) * 100) || 0
    }%`;
  }
}

function showResults(){
  const timeElapsed = (Date.now() - startTime) / 1000;
  const typedLength = quoteText.length;
  finalTime.textContent = Math.floor(timeElapsed);
  finalWpm.textContent = Math.floor(typedLength / 5 / (timeElapsed / 60)) || 0;
  finalAccuracy.textContent = `${
    Math.floor(((typedLength - errorCount) / typedLength) * 100) || 0
  }%`;
  resultCard.classList.remove("hidden");
}

function handleInput(e){
  if(!startTime && !gameMode){
    startTime = Date.now();
    timerInterval = setInterval(updateStats, 1000);
  }

  if(gameMode){
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      checkTypedWord();
    }
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
      showResults();
    }
  }
}

function startGameMode(){
  gameActive = true;
  startTime = Date.now();
  timerInterval = setInterval(updateStats, 1000);
  gameLoop();
  wordSpawnInterval = setInterval(generateWord, 2000);
  generateWord();
}

function clearFallingWords(){
  fallingWords.forEach(wordObj=> wordObj.element.remove());
  fallingWords = [];
}


async function startTest() {
  startTime =null;
  errorCount = 0;
  lives= 5;
  score = 0;
  currentIndex= 0;
  gameSpeed = 1;
  missedCount = 0;
  gameActive = false;

  clearAll();
  clearFallingWords();

  textInput.value = '';
  textInput.disabled = false;
  timer.textContent = '0';
  wpm.textContent = '0';

  congratulationsCard.classList.add("hidden");
  gameOverCard.classList.add("hidden");
  instructionCard.classList.add("hidden");
  if (resultCard) resultCard.classList.add("hidden");

  if(gameMode){
      textInput.classList.add("game-mode-input");
      paragraphDisplay.classList.add("hidden");
      renderLives();
      gameWords = await getGameWords();
      startGameMode();
  }
  else{
    textInput.classList.remove("game-mode-input");
    paragraphDisplay.classList.remove("hidden");
    accuracy.textContent = "0%";
    showLoading();
    quoteText = await getParagraph();
    displayParagraph(quoteText);
    hideLoading();
  }

  textInput.focus();
}



function setModeUI(){
  gameModeBtn.textContent = gameMode ? "Normal Mode" : "Game Mode";
  accuracyContainer.classList.toggle("hidden", gameMode);
  livesContainer.classList.toggle("hidden", !gameMode);
}

function toggleGameMode(){
  if(gameMode){
    gameMode = false;
    setModeUI();
    startTest();
  }
  else{
    clearAll();
    instructionCard.classList.remove("hidden");
  }
}

function startGameFromInstructions(){
  gameMode = true;
  setModeUI();
  startTest();
}

startTest();

textInput.addEventListener('input', handleInput);
textInput.addEventListener("keydown", handleInput);
restart.addEventListener('click', startTest);
resultRestart.addEventListener('click', startTest);
gameStartBtn.addEventListener('click', startGameFromInstructions);
gameOverRestart.addEventListener('click', startTest);
gameOverNormalMode.addEventListener('click', () => {
  gameMode = false;
  setModeUI();
  startTest();
});
congratsRestart.addEventListener('click', startTest);
congratsNormalMode.addEventListener('click', () => {
  gameMode = false;
  setModeUI();
  startTest();
});
gameModeBtn.addEventListener('click', toggleGameMode);

lengthButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.length === lengthMode) return;
    lengthMode = btn.dataset.length;
    lengthButtons.forEach((b) => b.classList.toggle("active", b === btn));
    startTest();
  });
});

[instructionCard, congratulationsCard, gameOverCard].forEach((card) => {
  document.addEventListener("mousedown", (e) => {
    if (card.classList.contains("hidden")) return;
    if (card.contains(e.target)) return;
    card.classList.add("hidden");
  });
});





