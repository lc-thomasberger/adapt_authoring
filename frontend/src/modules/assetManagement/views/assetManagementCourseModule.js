// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Origin = require('core/origin');
  var AssetManagementRefineModule = require('./assetManagementRefineModule');

  var AssetManagementCourseModule = AssetManagementRefineModule.extend({
    className: 'course',
    title: Origin.l10n.t('app.refinecoursetitle'),
    filterType: 'search',

    events: {
      'click input': 'onInputClicked'
    },

    initialize: function(options) {
      if(Origin.editor.data.courses) {
        // used by the template
        options.courses = Origin.editor.data.courses.toJSON();
      }
      AssetManagementRefineModule.prototype.initialize.apply(this, arguments);
    },

    resetFilter: function() {
      this.$('input').attr('checked', false);
    },

    onInputClicked: function(e) {
      var ors = [];
      _.each(this.$('input:checked'), function($el) {
        ors.push({ 'workspaces.course': $el.id })
      });
      this.applyFilter({ '$or':ors });
    }
  }, {
    template: 'assetManagementCourseModule'
  });

  return AssetManagementCourseModule;
});
