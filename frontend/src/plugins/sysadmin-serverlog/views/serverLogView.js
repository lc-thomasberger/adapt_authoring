// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var LogCollection = require('../collections/logCollection');
  var SysadminView = require('plugins/sysadmin/views/sysadminPluginView');

  var ServerLogView = SysadminView.extend({
    name: 'serverLog',
    settings: {
      autoRender: false
    },
    events: {
      'click button': 'updateFilters'
    },

    preRender: function() {
      (new LogCollection()).fetch({
        success: _.bind(function(logs) {
          this.model = new Backbone.Model({
            logs: logs,
            appliedFilters: ['info','warn','error']
          });
          this.render();
        }, this)
      });
    },

    postRender: function() {
      // go back to the top
      // this.$el.scrollTop(0);
      this.setViewToReady();
    },

    updateFilters: function(event) {
      var $btn = $(event.currentTarget);
      var filterType = $btn.attr('data-type');
      var shouldEnable = !$('i', $btn).hasClass('fa-toggle-on');
      var newFilters = this.model.get('appliedFilters').slice(0);

      if(!shouldEnable) {
        newFilters.splice(newFilters.indexOf(filterType),1);
      } else if(!_.contains(newFilters, filterType)) {
        newFilters.push(filterType);
      }
      this.model.set('appliedFilters', newFilters);
      this.render();
    }
  }, {
    template: 'serverLog'
  });

  return ServerLogView;
});
