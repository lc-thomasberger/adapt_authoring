// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var TagManagerView = require('./views/tagManagerView');

  Origin.on('sysadmin:ready', function() {
    Origin.trigger('sysadmin:addView', {
      name: 'tagmanager',
      title: Origin.l10n.t('app.tagmanager'),
      icon: 'fa-tags',
      view: TagManagerView
    });
  });
});
