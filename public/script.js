var HttpClient = function() {
  this.get = function(aUrl, aCallback) {
      var anHttpRequest = new XMLHttpRequest();
      anHttpRequest.onreadystatechange = function() {
          if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
              aCallback(anHttpRequest.responseText);
      }

      anHttpRequest.open( "GET", aUrl, true );
      anHttpRequest.send( null );
  }
}
const text_say = "Say Something",
  text_stop = "Stop"
let button = document.getElementById("button-say"),
  voiceList = document.getElementById("voices"),
  fileList = document.getElementById("files"),
  actionList = document.getElementById("actions"),
  loopBox = document.getElementById("loop-box"),
  loopButton = document.getElementById("loop"),
  settings = document.getElementById("settings"),
  loopMin = document.getElementById("loopMin"),
  loopMax = document.getElementById("loopMax"),
  countdownBox = document.getElementById("countdown"),
  voices = [],
  initialized = false,
  playing = false,
  playLoop = false,
  timeout, loopTimeoutMax, loopTimeoutMin,
  msg = new SpeechSynthesisUtterance(),
  client = new HttpClient();

speechSynthesis.onvoiceschanged = function() {
  if (initialized) {
    return
  }

  voices = speechSynthesis.getVoices()

  for (var i = 0; i < voices.length; i++) {
    var option = document.createElement("option");
    option.value = voices[i].lang;
    option.text = voices[i].name;
    voiceList.appendChild(option);
  }
  initialized = true
}

const removeOptions = function (selectbox) {
    var i;
    for(i = selectbox.options.length - 1 ; i >= 1 ; i--)
    {
        selectbox.remove(i);
    }
}

const toggleloopBox = function () {
  if (actionList.value == "") {
    loopBox.className = '';
  } else {
    loopBox.className = 'hidden';
  }
}

const updateActions = function() {
  removeOptions(actionList)
  client.get('v1/' + fileList.value + '-' + getActionValue() + '/actions', function(response) {
    const res = JSON.parse(response)
    if (!res.success) {
      alert('Something went wrong: ' + res.text)
      return
    }
    for (var i = 0; i < res.actions.length; i++) {
      var option = document.createElement("option");
      option.value = res.actions[i];
      option.text = res.actions[i];
      actionList.appendChild(option);
    }
  });
}

const getAndSayText = function (url, msg) {
  client.get(url, function(response) {
    const res = JSON.parse(response)
    if (!res.success) {
      alert('Something went wrong: ' + res.text)
      return
    }
    msg.text = res.text

    playing = true

    msg.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.lang == voiceList.value; })[0];
    window.speechSynthesis.speak(msg);
  });
}

const getActionValue = function() {
  return voiceList.value.replace('-', '_')
}

let timer, countdown, counter

function countdownFun() {
  countdown=countdown-1;
  if (countdown <= 0)
  {
     clearInterval(counter);
     countdownBox.innerHTML = ""
     return;
  }

  countdownBox.innerHTML = countdown + ' seconds'
}

function loopSay(url, msg, timeout) {
    getAndSayText(url, msg)
    if (!playLoop) {
      return
    }
    timer = setTimeout(loopSay.bind(null, url, msg), timeout);
}

window.onload = function() {
  button.innerHTML = text_say

  client.get('v1/files', function(response) {
    const res = JSON.parse(response)
    if (!res.success) {
      alert('Something went wrong: ' + res.text)
      return
    }
    for (var i = 0; i < res.files.length; i++) {
      var option = document.createElement("option");
      option.value = res.files[i];
      option.text = res.files[i];
      fileList.appendChild(option);
    }
    updateActions()
  });

  fileList.onchange = function () {
    updateActions()
  }

  actionList.onchange = function () {
    toggleloopBox()
  }

  button.onclick = function () {
    if (playing) {
      window.speechSynthesis.cancel()
      clearTimeout(timer)
      clearInterval(counter);
      playing = false
      playLoop = false
      button.innerHTML = text_say
      settings.className = ""
      countdownBox.innerHTML = ""

    } else {
      let url = 'v1/' + fileList.value + '-' + getActionValue()

      if (actionList.value != "") {
        url += '/' + actionList.value
      }

      button.innerHTML = text_stop
      settings.className = "disabled"

      if (actionList.value == "" && loop.checked) {
        playLoop = true
        loopTimeoutMin = loopMin.value * 60 * 1000
        loopTimeoutMax = loopMax.value * 60 * 1000

        if (loopTimeoutMin > loopTimeoutMax) {
          alert ('Min must be less than max')
          playLoop = false
          return
        }

        timeout = Math.floor(Math.random() * (loopTimeoutMax - loopTimeoutMin)) + loopTimeoutMin;
        countdown = Math.floor(timeout / 1000)
        console.log(timeout)
        counter=setInterval(countdownFun, 500); //1000 will  run it every 1 second
      }

      loopSay(url, msg, timeout)
    }
  }
}
