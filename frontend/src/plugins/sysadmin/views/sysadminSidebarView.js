// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('core/origin');
  var SidebarItemView = require('modules/sidebar/views/sidebarItemView');

  var SysadminSidebarView = SidebarItemView.extend({
    initialize: function(options) {
      if (options && options.plugins) {
        this.plugins = options.plugins;
      }
      SidebarItemView.prototype.initialize.apply(this, arguments);
    },

    postRender: function() {
      for(var i = 0, count = this.plugins.length; i < count; i++) {
        this.addSidebarButton(this.plugins[i]);
      }
      this.setViewToReady();
    },

    addSidebarButton: function(data) {
      _.defaults(data, { icon: 'fa-chevron-right' });
      var template = Handlebars.templates['sysadminSidebarButton'];
      this.$el.append(template(data));
      this.$('.button-' + data.name).click(this.onButtonclick);
    },

    onButtonclick: function(event) {
      event && event.preventDefault();
      var $pluginDiv = $('.sysadmin-plugin.' + $(event.currentTarget).attr('data-name'));
      $('.contentPane').scrollTo($pluginDiv, 300);
    }
  }, {
    template: 'sysadminSidebar'
  });
  return SysadminSidebarView;
});
