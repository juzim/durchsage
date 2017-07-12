var express = require('express');
var app = express();
var fs = require('fs');

const sendResponse = (request, response, data) => {
  let result;
  response.setHeader('charset', 'utf8');

  if (request.query.format == 'json') {
    response.setHeader("Content-Type", "application/json; charset=utf-8")
    result = JSON.stringify(data);
  } else {
    response.setHeader("Content-Type", "text/plain; charset=utf-8")
    result = data.text
  }
  const buffer = new Buffer(result)
  response.setHeader('Content-Length', buffer.length)
  response.end(buffer.toString('utf-8'))
}

module.exports = function(app){

  app.get('/v1', function(req, res) {
    try {
      const file = req.query.file
      if (file === undefined || !fs.existsSync('config/' + file + '.json')) {
        throw "Config file '" + file + "' not found"
      } else {
        process.env.NODE_ENV = file
      }

      var config = require('config');
      const action = config.get("actions")[Math.floor(Math.random() * config.get("actions").length)];
      var text = config.get("texts")[action], orgtext = text

      let valueList = JSON.parse(JSON.stringify(config.get("values")))
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
    sendResponse(req, res, {"text": text})
  })
}
