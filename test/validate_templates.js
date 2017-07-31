var fs = require('fs');
var jsonfile = require('jsonfile')
var yaml = require('js-yaml');

const BASE_DIR = 'templates/'
const templates = fs.readdirSync(BASE_DIR);

QUnit.test( "Validate template files", function( assert ) {
  var file
  for (var i = 0; i < templates.length; i++) {
    file = BASE_DIR + templates[i]
    if (file.endsWith(".json")) {
      assert.ok(jsonfile.readFileSync(file))
    } else if (file.endsWith(".yaml")) {
      assert.ok(yaml.safeLoad(fs.readFileSync(file)))
    } else {
      assert.ok(false, file + " is not a valid template file")
    }
  }
})
