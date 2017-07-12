#! /usr/bin/node
const http = require('http')
const port = 3009
var express = require('express');
var app = express();
var fs = require('fs');
var RateLimit = require('express-rate-limit');

var limiter = new RateLimit({
  windowMs: 60*60*24, // 24h
  max: 100, // limit each IP to 100 requests per windowMs
  delayMs: 0 // disable delaying - full speed until the max limit is reached
});

var list

app.use(limiter);

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

app.get('/v1', function(req, res) {
  console.log("\n\nNew request: ", JSON.stringify(req.query))
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
    console.log('init ' + JSON.stringify(valueList))

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

  console.log("----------Result: " + text);
  sendResponse(req, res, {"text": text})
})

var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});
