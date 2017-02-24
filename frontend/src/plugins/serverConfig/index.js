// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var ServerConfigView = require('./views/serverConfigView.js');

  var TITLE = 'Server Config';
  var CLASSNAME = 'serverConfig';

  Origin.on('globalMenu:' + CLASSNAME + ':open', function() {
    Origin.router.navigate('#/' + CLASSNAME, {trigger: true});
  });

  Origin.on('app:dataReady login:changed', function() {
    var permissions = ["*/*:create","*/*:read","*/*:update","*/*:delete"];
    Origin.permissions.addRoute(CLASSNAME, permissions);
    if (Origin.permissions.hasPermissions(permissions)) {
      Origin.globalMenu.addItem({
        "location": "global",
        "text": TITLE,
        "icon": "fa-file-text ",
        "callbackEvent": CLASSNAME + ":open"
      });
    }
  });

  Origin.on('router:' + CLASSNAME, function(location, subLocation, action) {
    Origin.trigger('sidebar:views:remove');
    Origin.trigger('location:title:update', { title: TITLE });
    Origin.router.createView(ServerConfigView);
  });
});
