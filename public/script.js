let playing = false
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
const text_say = "Say Something"
const text_stop = "Stop"
let button = document.getElementById("button-say")
let voiceList = document.getElementById("voices")
let fileList = document.getElementById("files")
let actionList = document.getElementById("actions")
let voices = []
let initialized = false

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

const updateActions = function() {
  removeOptions(actionList)
  client.get('v1/' + fileList.value + '_' + voiceList.value + '/actions', function(response) {
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

var msg = new SpeechSynthesisUtterance();
var client = new HttpClient();

msg.onstart = function (event) {
  button.innerHTML = text_stop
};

msg.onend = function (event) {
  button.innerHTML = text_say
};

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

  button.onclick = function () {
    if (playing) {
      window.speechSynthesis.cancel()
      playing = false
    } else {
      let url = 'v1/' + fileList.value + '_' + voiceList.value

      if (actionList.value != "") {
        url += '/' + actionList.value
      }

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
  }
}
