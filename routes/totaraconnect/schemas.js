var fs = require('fs-extra');
var path = require('path');
var origin = require('../../lib/application')();

module.exports = function() {
  addSchema('publishedcourse');
  addSchema('token');

  // origin.contentmanager.addContentHook('destroy', 'course', { when: 'post' }, function(contentType, data, next) {
  //   origin.db.destroy('publishedcourse', { course: data._id });
  // });
  // origin.contentmanager.addContentHook('destroy', 'user', { when: 'post' }, function(contentType, data, next) {
  //   origin.db.destroy('token', { user: data._id });
  // });
};

function addSchema(schemaName) {
  fs.readFile(path.join(__dirname, `${schemaName}.schema`), function(error, buffer) {
    if(error) {
      return console.log(error);
    }
    try {
      var schema = JSON.parse(buffer.toString());
    } catch(e) {
      return console.log(e);
    }
    origin.db.addModel(schemaName, schema, function(error, schema) {
      if(error) console.log(error);
    });
  });
}
