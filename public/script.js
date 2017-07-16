const showMessage = function (title, message, type) {
  currentAnnouncementBox.className = "alert alert-" + type
  currentAnnouncementTitle.innerHTML = title
  currentAnnouncement.innerHTML = message
}

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
  client = new HttpClient(),
  cachedActions = {},
  cachedTemplates = {}

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
    for(i = selectbox.options.length - 1 ; i >= 0 ; i--)
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

const updateLocations = function () {
  removeOptions(voiceList)

  // const availableLocations = templates.filter(function (f) {
  //   return f.split('-')[0] == templateList.value
  // }).map(function(l) { return l.split('-')[1]})

  const availableVoices = Array.from(new Set(voices.map(function(v) {
    return {lang: getFormatedLocation(v.lang), name: v.name}
  })))

  for (var i = 0; i < availableVoices.length; i++) {
    addOption(voiceList, availableVoices[i].name, availableVoices[i].name)
  }
  setLoadingState("voices", false)

  updateTemplates()
}

const updateTemplates = function() {
  setLoadingState("actions", true)
  setLoadingState("templates", true)
  button.className = "disabled"
  loopBox.className = "disabled"
  currentAnnouncementBox.className = "hidden"

  try {
    removeOptions(templateList)
    console.log(getVoiceLocationFromName(voiceList.value))

    const templatesForLocation = templates.filter(function (t) {
      return t.split('-')[1] == getVoiceLocationFromName(voiceList.value)
    })

    if (templatesForLocation.length == 0) {
      throw "No templates found for this language. Feel free to add new ones on github"
    }

    modes = templatesForLocation.map(function(f) { return f.split('-')[0];})
    for (var i = 0; i < modes.length; i++) {
      var option = document.createElement("option");
      option.value = modes[i];
      option.text = modes[i];
      templateList.appendChild(option);
    }
    setLoadingState("templates", false)
    updateActions()
  } catch (e) {
    showMessage('Template not found', "No template was found for this language, feel free to add your own at github", "warning")
    throw e
  }
}

const getVoiceLocationFromName = function (name) {
    return getFormatedLocation(speechSynthesis.getVoices().filter(function(v) {
      return v.name == name})[0].lang)
}

const addOption = function(list, value, text) {
  var option = document.createElement("option");
  option.value = value;
  option.text = text;
  list.appendChild(option);
}

const setNewActions = function(actions) {
  addOption(actionList, "", "random")
  for (var i = 0; i < actions.length; i++) {
    addOption(actionList, actions[i], actions[i])
  }
  setLoadingState("actions", false)
  button.className = ""
  toggleloopBox()
}

const updateActions = function() {
  removeOptions(actionList)
  const actionsKey = templateList.value + '-' + getVoiceLocationFromName(voiceList.value)

  if (cachedActions[actionsKey] != undefined) {
    setNewActions(cachedActions[actionsKey])
  } else {
    client.get('v1/' + actionsKey + '/actions', function(response) {
      const res = JSON.parse(response)
      if (!res.success) {
        showMessage('Something went wrong: ', res.text, "error")
        reset()
        return
      }

      cachedActions[actionsKey] = res.actions
      setNewActions(res.actions)
    });
  }
}

const toggleIntervalOptions = function() {
    if (loopButton.checked) {
      intervalBox.className = ''
    } else {
      intervalBox.className = 'hidden'
    }
}

const getAndSayText = function (msg) {
  client.get(getUrl(), function(response) {
    const res = JSON.parse(response)
    if (!res.success) {
      alert('Something went wrong: ' + res.text)
      return
    }
    msg.text = res.text
    msg.voice = speechSynthesis.getVoices().filter(function(voice) {
      return voice.name == voiceList.value
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

function loopSay(msg, timeout) {
    playing = true
    getAndSayText(msg)
    if (!playLoop) {
      return
    }

    timeout = Math.floor(Math.random() * (loopTimeoutMax - loopTimeoutMin)) + loopTimeoutMin;
    timer = setTimeout(loopSay.bind(null, msg, timeout), timeout);
    startCountdown(timeout)
}

const getUrl = function() {

  let url = 'v1/' + templateList.value + '-' + getVoiceLocationFromName(voiceList.value)

  if (actionList.value != "") {
    url += '/' + actionList.value
  }

  return url
}

const handleButtonClick = function() {
  if (playing) {
    reset()
  } else {
    initialized = true
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

    loopSay(msg)
  }
}

const setLoadingState = function(list, bool) {
  let node = document.getElementById("select-loading-" + list)
  if (bool) {
    node.className = ""
  } else {
    node.className = "hidden"
  }
}

  speechSynthesis.onvoiceschanged = function() {
  if (initialized) {
    return
  }
  reset()
  setLoadingState("templates", true)

  voices = speechSynthesis.getVoices()

  if (voices.length == 0) {
    showMessage('Error', 'SpeechSynthesis could not be loaded. You are either not connected to the internet or your browser does not support it.', "danger")
    return
  }

  voiceList.onchange = function () {
    updateTemplates(templates)
  }

  templateList.onchange = function () {
    setLoadingState("actions", true)
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

  client.get('v1/templates', function(response) {
    const res = JSON.parse(response)
    if (!res.success) {
      alert('Something went wrong: ' + res.text)
      return
    }
    templates = res.templates
    updateLocations()
  });
}
