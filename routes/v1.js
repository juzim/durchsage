var express = require('express');
var fs = require('fs');
var router = require('express').Router();
var jsonfile = require('jsonfile')

const getConfig = (file) => {
  if (file === undefined || !fs.existsSync('config/' + file + '.json')) {
    throw "Config file '" + file + "' not found"
  }
  return jsonfile.readFileSync('config/' + file + '.json');
}

const sendResponse = (request, response, data) => {
  let result;
  response.setHeader('charset', 'utf8');

  response.setHeader("Content-Type", "application/json; charset=utf-8")
  result = JSON.stringify(data);

  const buffer = new Buffer(result)
  response.setHeader('Content-Length', buffer.length)
  response.end(buffer.toString('utf-8'))
}

router.route('/files').get(function (req, res) {
  const files = fs.readdirSync('config/');
  sendResponse(req, res, {"success": true, "files":
  files
  // .filter(function(f) { @todo check if file for lang exists
  //   return f.split('_')[1] == req.quer;
  // })
  .map(function(f) {
    return f.split('.')[0];
  }
  )})
})


router.route('/:file/actions').get(function (req, res) {
  const config = getConfig(req.params.file)
  sendResponse(req, res, {"success": true, "file": req.params.action, "actions": config.actions})
})

router.route('/:file/:action*?')
  .get(function(req, res) {
  try {
    const config = getConfig(req.params.file)
    let action
    if (req.params.action) {
      action = req.params.action;

      if (config.actions.indexOf(action) === -1) {
        throw "Action '" + action + "' does not exist in " + config.actions.join(', ')
      }
    } else {
      action = config.actions[Math.floor(Math.random() * config.actions.length)];
    }
    console.log(req.params.action, action)

    var text = config.texts[action], orgtext = text

    let valueList = JSON.parse(JSON.stringify(config.values))
    let i = 0;
    while (text.match(/{(\w+)}/)) {
      i++
      if (i > 10) {
        throw "Too many loops while parsing placeholders for " + orgtext
      }
      text = text.replace(/{(\w+)}/g, function (w, m) {
        if (valueList[m] == undefined) {
          throw "Could not match placeholder " + m
        }
        let values = valueList[m]

        if (values.length == 0) {
          throw "No more unique values left for '" + m + "'. Please add more choices to the config"
        }

        let index = Math.floor(Math.random() * values.length)
        const item = values[index];
        values.splice(index, 1)
        return item;
      });
    }
  } catch (e) {
    console.log(e)

    sendResponse(req, res, {"success": false, "text": e})
    return
  }

  console.log("Result: " + text);
  sendResponse(req, res, {"success": true, "text": text})
})

module.exports = router;
