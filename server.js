#! /usr/bin/node

var express = require('express');
var app = express();
var RateLimit = require('express-rate-limit');
var morgan = require('morgan')
app.use(morgan('tiny'))

var limiter = new RateLimit({
  windowMs: 60*60*24, // 24h
  max: 100, // limit each IP to 100 requests per windowMs
  delayMs: 0 // disable delaying - full speed until the max limit is reached
});

app.use(limiter);
require('./routes')(app);

var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});
