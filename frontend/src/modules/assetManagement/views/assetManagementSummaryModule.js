// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var AssetManagementRefineModule = require('./assetManagementRefineModule');

  var AssetManagementSummaryModule = AssetManagementRefineModule.extend({
    className: 'summary',
    renderWrapper: false,

    events: {
      'click a.reset': 'onResetClicked'
    },

    initialize: function() {
      AssetManagementRefineModule.prototype.initialize.apply(this, arguments);

      this.listenTo(Origin, {
        'assetManagement:assetManagementCollection:fetched': this.update,
        'assetManagement:refine:ready': this.onRefineReady
      });
    },

    update: function(collection) {
      if(collection) {
        this.$('.assetCount', this.$el).html(collection.length);
      }
    },

    resetFilter: function() {
      this.applyFilter();
    },

    showResetButton: function() {
      this.$('a.reset').removeClass('hide');
    },

    hideResetButton: function() {
      this.$('a.reset').addClass('hide');
    },

    onRefineReady: function() {
      this.hideResetButton();
      this.listenTo(Origin, 'assetManagement:refine:apply', this.showResetButton);
    },

    onResetClicked: function(e) {
      e && e.preventDefault();
      Origin.trigger('assetManagement:refine:reset');
      this.hideResetButton();
    }
  }, {
    template: 'assetManagementSummaryModule'
  });

  return AssetManagementSummaryModule;
});
