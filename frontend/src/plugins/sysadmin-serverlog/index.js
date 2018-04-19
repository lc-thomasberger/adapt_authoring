// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  Handlebars = require('handlebars');
  var Origin = require('core/origin');
  var ServerLogView = require('./views/serverLogView');

  Origin.on('sysadmin:ready', function() {
    Origin.trigger('sysadmin:addView', {
      name: 'serverLog',
      title: Origin.l10n.t('app.serverlog'),
      icon: 'fa-server',
      view: ServerLogView
    });
  });

  Handlebars.registerHelper('ifIn', function(item, list, options) {
    return _.indexOf(list, item) > -1 ? options.fn(this) : options.inverse(this);
  });
});
