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
  const file = req.query.file
  if (file === undefined || !fs.existsSync('config/' + file + '.json')) {
    sendResponse(req, res, {"success": false, "text": "No config file '" + file + "' found"})
    return
  } else {
    process.env.NODE_ENV = file
  }

  var config = require('config');

  const list = config.get("values")
  console.log('New request')

  const action = getRandomFromList('action', config.get("actions"))

  let text = config.get("texts")[action]

  if (config.has("texts.prefix")) {
    text = config.get("texts.prefix") + text
  }

 //	const result = text.replace('{train}', train).replace('{gleis}', gleis).replace('{city}', city).replace('{action}', action);
 	 text = text.replace(/{(\w+)}/g, function (w, m) {
 		return getRandomFromList(m, list[m]);
 });
 // dirty way to handle nested placeholders
 text = text.replace(/{(\w+)}/g, function (w, m) {
   return getRandomFromList(m, list[m]);
});

 console.log("Result: " + text);

   sendResponse(req, res, {"text": text})
})


var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});
