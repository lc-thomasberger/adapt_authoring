// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var OriginView = require('core/views/originView');

  var SysadminPluginView = OriginView.extend({
    tagName: 'div',
    className: function() {
      return 'sysadmin-plugin ' + this.name;
    },

    postRender: function() {
      this.setViewToReady();
    }
  });

  return SysadminPluginView;
});
