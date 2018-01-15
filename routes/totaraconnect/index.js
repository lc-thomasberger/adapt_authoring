var Constants = require('./constants');
var origin = require('../../lib/application')();
var permissions = require('../../lib/permissions');
var router = require('./router');
var schemas = require('./schemas');

// handles custom schema stuff
schemas();

permissions.ignoreRoute(Constants.Route);
origin.server.use(`/${Constants.Route}`, router);

// empty func because we handle the middleware ourselves
module.exports = function() {};
