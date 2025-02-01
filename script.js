const paragraph = document.getElementById("paragraph");
const textInput = document.getElementById("textInput");
const wpm = document.getElementById("wpm");
const accuracy = document.getElementById("accuracy");
const restart = document.getElementById("restart");
const timer = document.getElementById("timer");

let quoteText = '';
let startTime = null;
let timerInterval = null;
let errorCount = 0;

async function getParagraph(){
    try {
      const response = await fetch(
        "http://api.quotable.io/random?minLength=300"
      );
      const data = await response.json();
      return data.content;
    } catch (error) {
      return "The quick brown fox jumps over the lazy dog. This is a fallback text in case the API fails to respond. Please try again later.";
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
}

function handleInput(e){
  if(!startTime){
    startTime = Date.now();
    timerInterval = setInterval(updateStats, 1000);
  }
  const quoteSpans = document.querySelectorAll('#paragraph span');
  const inputValue = e.target.value.split('');
  let newErrorCount = 0;

  quoteSpans.forEach((span, index)=>{
    const inputChar = inputValue[index];
    if(!inputChar){
      span.classList.remove('correct', 'incorrect');
    }
    else if(inputChar == span.innerText){
      span.classList.add('correct');
      span.classList.remove('incorrect');
    }
    else{
      span.classList.add('incorrect');
      span.classList.remove('correct');
      newErrorCount++;
    }
  });
  errorCount= newErrorCount;

  if(inputValue.length === quoteText.length){
    clearInterval(timerInterval);
    textInput.disabled = true;
  }
}

async function initTest() {
  startTime =null;
  errorCount = 0;
  clearInterval(timerInterval);
  textInput.value = '';
  textInput.disabled = false;
  timer.textContent = '0';
  wpm.textContent = '0';
  accuracy.textContent = '0';

  quoteText = await getParagraph();
  displayParagraph(quoteText);

  textInput.focus();
  
}
textInput.addEventListener('input', handleInput);
initTest();
console.log(getParagraph());

// restart.addEventListener("click", ()=>{
//     getParagraph();
// })