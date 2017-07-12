#! /usr/bin/node
const http = require('http')
const port = 3009
var config = require('config');
var express = require('express');
var app = express();

const getRandomFromList = (type, setList) => {
  var list
  if (setList == undefined) {
    list = config.get("values")[type]
  } else {
    list = setList
  }
	const ran = Math.floor(Math.random()*list.length);
	return list[ran];
}

const sendResponse = (request, response, data) => {
  if (request.query.format == 'json') {
    response.writeHead(200, {"Content-Type": "application/json"})
    var json = JSON.stringify(data);
    response.end(json)
    return
  }

  response.end(data.text)
}

app.get('/', function(req, res) {
  console.log('New request')
  const action = getRandomFromList('action', config.get("actions"))

  let text = config.get("texts")[action]

  if (config.has("texts.prefix")) {
    text = config.get("texts.prefix") + text
  }

 //	const result = text.replace('{train}', train).replace('{gleis}', gleis).replace('{city}', city).replace('{action}', action);
 	 text = text.replace(/{(\w+)}/g, function (w, m) {
 		return getRandomFromList(m);
 });
 // dirty way to handle nested placeholders
 text = text.replace(/{(\w+)}/g, function (w, m) {
   return getRandomFromList(m);
});

 console.log("Result: " + text);

   sendResponse(req, res, {"text": text})
})

app.listen(3009);
