// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Handlebars = require('handlebars');
  var Origin = require('core/origin');
  var ServerConfigView = require('./views/serverConfigView');

  Origin.on('sysadmin:ready', function() {
    Origin.trigger('sysadmin:addView', {
      name: 'serverConfig',
      title: Origin.l10n.t('app.serverconfig'),
      icon: 'fa-wrench',
      view: ServerConfigView
    });
  });

  Handlebars.registerHelper('toString', function(obj) {
    return obj.toString();
  });
});
