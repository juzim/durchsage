var fs = require('fs');
var jsonfile = require('jsonfile')

const BASE_DIR = 'templates/'
const templates = fs.readdirSync(BASE_DIR);

QUnit.test( "Validate template files", function( assert ) {

  for (var i = 0; i < templates.length; i++) {
    assert.ok(jsonfile.readFileSync(BASE_DIR + templates[i]))
  }
})
