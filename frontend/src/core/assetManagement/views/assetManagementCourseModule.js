// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var AssetManagementRefineModule = require('coreJS/assetManagement/views/assetManagementRefineModule');
  var Origin = require('coreJS/app/origin');

  var AssetManagementCourseModule = AssetManagementRefineModule.extend({
    className: 'course',
    title: 'Filter by course',
    filterType: 'search',

    events: {
      'change input': 'onInputChanged',
      'click .reset': 'onResetClicked'
    },

    initialize: function(options) {
      if(Origin.editor.data.courses) {
        // used by the template
        options.courses = Origin.editor.data.courses.toJSON();
      }
      AssetManagementRefineModule.prototype.initialize.apply(this, arguments);
    },

    resetFilter: function() {
      this.$('input').prop('checked', false).change();
    },

    onInputChanged: _.debounce(function() {
      var ors = [];

      this.$('input:checked').each(function() {
        if (this.id === 'no-course') {
          // TODO: check no course filter
          ors.push({
            'workspaces.course': { $exists: false }
          }, {
            'workspaces.course': []
          });
        } else {
          ors.push({ 'workspaces.course': this.id });
        }
      });

      this.applyFilter({ '$or': ors });
      this.$('.reset').toggleClass('display-none', !ors.length);
    }, 0),

    onResetClicked: function(event) {
      event.preventDefault();

      this.resetFilter();
    }
  }, {
    template: 'assetManagementCourseModule'
  });

  return AssetManagementCourseModule;
});
