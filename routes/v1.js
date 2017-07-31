var express = require('express');
var fs = require('fs');
var router = require('express').Router();
var jsonfile = require('jsonfile')
var yaml = require('js-yaml');

const BASE_DIR = 'templates/'

const getTemplate = (file) => {
  if (fs.existsSync(BASE_DIR + file + '.json')) {
    return jsonfile.readFileSync(BASE_DIR + file + '.json');
  } else if (fs.existsSync(BASE_DIR + file + '.yaml')) {
    return yaml.safeLoad(fs.readFileSync(BASE_DIR + file + '.yaml', {encoding: 'utf-8'}));
  }
    throw "Template '" + file + "' not found"
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

router.route('/templates').get(function (req, res) {
  const templates = fs.readdirSync(BASE_DIR);
  sendResponse(req, res, {"success": true, "templates":
    templates.map(function(f) {
      return f.split('.')[0];
    }
  )})
})

const getActionList = (template) => {
  var keys = [];
  for(var k in template.texts) {
    keys.push(k)
  }

  return keys
}

router.route('/:file/actions').get(function (req, res) {
  const template = getTemplate(req.params.file), actions = getActionList(template)

  sendResponse(req, res, {"success": true, "file": req.params.action, "actions": actions})
})

router.route('/:file/:action*?')
  .get(function(req, res) {
  try {
    const template = getTemplate(req.params.file),
    actions = getActionList(template)
    let action
    if (req.params.action) {
      action = req.params.action;

      if (actions.indexOf(action) === -1) {
        throw "Action '" + action + "' does not exist in " + actions.join(', ')
      }
    } else {
      action = actions[Math.floor(Math.random() * actions.length)];
    }

    var text = template.texts[action], orgtext = text
    
    let valueList = JSON.parse(JSON.stringify(template.values)), i = 0

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
          throw "No more unique values left for '" + m + "'. Please add more choices to the template"
        }

        let index = Math.floor(Math.random() * values.length)
        const item = values[index];
        values.splice(index, 1)
        return item;
      });
    }
  } catch (e) {
    console.log(e)

    sendResponse(req, res, {"success": false, "text": e.message})
    return
  }

  console.log("Result: " + text);
  sendResponse(req, res, {"success": true, "text": text})
})

module.exports = router;
