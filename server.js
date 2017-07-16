#! /usr/bin/node

var express = require('express');
var app = express();
var RateLimit = require('express-rate-limit');
var morgan = require('morgan')
app.use(morgan('tiny'))
var config = require('config');

var limiter = new RateLimit({
  windowMs: config.get("rateLimit.windowMs"),
  max: config.get("rateLimit.max"),
  delayMs: config.get("rateLimit.delayMs")
});

if (config.get("rateLimit.enabled")) {
  app.use(limiter);
}

var v1 = require('./routes/v1');
app.use('/v1', v1);

if (config.get("enableFrontend")) {
  app.use(express.static('public'))
}

var server = app.listen(process.env.PORT || config.get('port')|| 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});
