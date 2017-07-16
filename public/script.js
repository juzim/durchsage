function main() {
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
    templateList = document.getElementById("templates"),
    actionList = document.getElementById("actions"),
    loopBox = document.getElementById("loop-box"),
    loopButton = document.getElementById("loop"),
    settings = document.getElementById("settings"),
    loopMin = document.getElementById("loopMin"),
    loopMax = document.getElementById("loopMax"),
    countdownBox = document.getElementById("countdown"),
    intervalBox = document.getElementById("interval-box"),
    currentAnnouncement = document.getElementById("current-announcement"),
    currentAnnouncementTitle = document.getElementById("current-announcement-title"),
    currentAnnouncementBox = document.getElementById("current-announcement-box"),
    voices = [],
    templates = [],
    modes = [],
    initialized = false,
    playing = false,
    playLoop = false,
    timeout, loopTimeoutMax, loopTimeoutMin,
    msg = new SpeechSynthesisUtterance(),
    client = new HttpClient();

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

  const updateLocations = function (templates) {
    removeOptions(voiceList)
    const availableLocations = templates.filter(function (f) {
      return f.split('-')[0] == templateList.value
    }).map(function(l) { return l.split('-')[1]})

    const availableVoices = Array.from(new Set(voices.filter(function(v) {
      return availableLocations.indexOf(getFormatedLocation(v.lang)) != -1
    }).map(function(v) { return {lang: v.lang, name: v.name}})))

    for (var i = 0; i < availableVoices.length; i++) {
      var option = document.createElement("option");
      option.value = availableVoices[i].lang;
      option.text = availableVoices[i].name;
      voiceList.appendChild(option);
    }

    updateActions()
  }

  const updateActions = function() {
    removeOptions(actionList)
    client.get('v1/' + templateList.value + '-' + getFormatedLocation(voiceList.value) + '/actions', function(response) {
      const res = JSON.parse(response)
      if (!res.success) {
        alert('Something went wrong: ' + res.text)
        reset()
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
      msg.voice = speechSynthesis.getVoices().filter(function(voice) {
        return getFormatedLocation(voice.lang) == getFormatedLocation(voiceList.value)
      })[0];
      window.speechSynthesis.speak(msg);
      showMessage("Current announcement", res.text, "info")
    });
  }

  const getFormatedLocation = function(value) {
    return value.replace('-', '_')
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
    let url = 'v1/' + templateList.value + '-' + getFormatedLocation(voiceList.value)

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

  const showMessage = function (title, message, type) {
    currentAnnouncementBox.className = type
    currentAnnouncementTitle.innerHTML = title
    currentAnnouncement.innerHTML = message
  }

  speechSynthesis.onvoiceschanged = function() {
    if (initialized) {
      return
    }

    voices = speechSynthesis.getVoices()

    if (voices.length == 0) {
      showMessage('Error', 'SpeechSynthesis could not be loaded. Are you connected to the internet?', "error")
      return
    }

    initialized = true

    client.get('v1/templates', function(response) {
      const res = JSON.parse(response)
      if (!res.success) {
        alert('Something went wrong: ' + res.text)
        return
      }
      modes = Array.from(new Set(res.templates.map(function(f) { return f.split('-')[0];})))
      for (var i = 0; i < modes.length; i++) {
        var option = document.createElement("option");
        option.value = modes[i];
        option.text = modes[i];
        templateList.appendChild(option);
      }
      updateLocations(res.templates)

      button.innerHTML = text_say

      templateList.onchange = function () {
        updateLocations(templates)
      }

      voiceList.onchange = function () {
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
    });
  }
}

main()
