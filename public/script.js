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
  intervalBox = document.getElementById("interval-box"),
  currentAnnouncement = document.getElementById("current-announcement"),
  currentAnnouncementBox = document.getElementById("current-announcement-box"),
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

msg.onend = function() {
  if (!playLoop) {
    reset()
  }
}

var reset = function() {
  window.speechSynthesis.cancel()
  clearTimeout(timer)
  clearInterval(counter);
  playing = false
  playLoop = false
  button.innerHTML = text_say
  settings.className = ""
  countdownBox.innerHTML = ""
  currentAnnouncementBox.className = "hidden"
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

const toggleIntervalOptions = function() {
    if (loopButton.checked) {
      intervalBox.className = ''
    } else {
      intervalBox.className = 'disabled'
    }
}

const getAndSayText = function (url, msg) {
  client.get(url, function(response) {
    const res = JSON.parse(response)
    if (!res.success) {
      alert('Something went wrong: ' + res.text)
      return
    }
    msg.text = res.text
    msg.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.lang == voiceList.value; })[0];
    window.speechSynthesis.speak(msg);
    currentAnnouncementBox.className = ""
    currentAnnouncement.innerHTML = res.text
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

  countdownBox.innerHTML = "Next announcement in " + countdown + ' seconds'
}
const startCountdown = function (timeout) {
  countdown = Math.floor(timeout / 1000)
  counter = setInterval(countdownFun, 1000)
}

function loopSay(url, msg, timeout) {
    playing = true
    getAndSayText(url, msg)
    if (!playLoop) {
      return
    }

    timeout = Math.floor(Math.random() * (loopTimeoutMax - loopTimeoutMin)) + loopTimeoutMin;
    timer = setTimeout(loopSay.bind(null, url, msg, timeout), timeout);
    startCountdown(timeout)
}

const getUrl = function() {
  let url = 'v1/' + fileList.value + '-' + getActionValue()

  if (actionList.value != "") {
    url += '/' + actionList.value
  }

  return url
}

const handleButtonClick = function() {
  if (playing) {
    reset()
  } else {
    button.innerHTML = text_stop
    settings.className = "disabled"

    if (actionList.value == "" && loop.checked) {
      playLoop = true
      loopTimeoutMin = loopMin.value  * 1000 * 60
      loopTimeoutMax = loopMax.value  * 1000 * 60

      if (loopTimeoutMin > loopTimeoutMax) {
        alert ('Min must be less than max')
        playLoop = false
        return
      }
    }

    loopSay(getUrl(), msg)
  }
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

  loopButton.onchange = function (e) {
    toggleIntervalOptions()
  }

  button.onclick = function () {
    handleButtonClick()
  }
}
