// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var SysadminPluginView = require('plugins/sysadmin/views/sysadminPluginView');

  var ServerConfigView = SysadminPluginView.extend({
    name: 'serverConfig',

    preRender: function() {
      this.model = new Backbone.Model(Origin.constants);
    },

    postRender: function() {
      this.setViewToReady();
    }
  }, { template: 'serverConfig' });

  return ServerConfigView;
});
