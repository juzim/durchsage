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

app.use(limiter);

const getRandomFromList = (type, list) => {
	const ran = Math.floor(Math.random()*list.length);
	return list[ran];
}

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
  try {

    const file = req.query.file
    if (file === undefined || !fs.existsSync('config/' + file + '.json')) {
      throw "Config file '" + file + "' not found"
    } else {
      process.env.NODE_ENV = file
    }

    var config = require('config');

    const list = config.get("values")
    console.log('New request')

    const action = getRandomFromList('action', config.get("actions"))

    var text = config.get("texts")[action]

    if (config.has("texts.prefix")) {
      text = config.get("texts.prefix") + text
    }

    var i = 0;
    while (text.match(/{(\w+)}/)) {
      i++
      if (i > 10) {
        throw "Too many loops while parsing placeholders for " + text
      }
      text = text.replace(/{(\w+)}/g, function (w, m) {
        if (list[m] == undefined) {
          throw "Could not match placeholder " + m
        }
        return getRandomFromList(m, list[m]);
      });
    }
  } catch (e) {
    sendResponse(req, res, {"success": false, "text": e})
    return
  }

  console.log("Result: " + text);
  sendResponse(req, res, {"text": text})
})

var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});
