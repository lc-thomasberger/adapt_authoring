// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var ContentCollection = require('core/collections/contentCollection');
  var TagCollection = Backbone.Collection.extend({ url: '/api/content/tag' });

  var TAG_PREFIX = 'test-'

  var TagMapView = OriginView.extend({
    className: 'tagmap',
    settings: {
      autoRender: false
    },

    initialize: function(options) {
      this.model = new Backbone.Model({
        tags: new TagCollection(),
        courses: new ContentCollection(null, { _type: 'course' })
      });
      OriginView.prototype.initialize.apply(this, arguments);
    },

    preRender: function() {
      this.fetchTags(function() {
        this.fetchCourses(function() {
          this.model.get('tags').each(function(tag) {
            var tagId = tag.get('_id');
            tag.set('courses', this.model.get('courses').filter(function(course) {
              return _.some(course.get('tags'), function(tag) { return tag._id === tagId });
            }));
          }, this);
          this.render();
        });
      });
    },

    fetchTags: function(cb) {
      this.model.get('tags').fetch({
        data: { title: { $regex: '^' + TAG_PREFIX } },
        success: _.bind(cb, this)
      });
    },

    fetchCourses: function(cb) {
      this.model.get('courses').fetch({
        data: {
          $or: this.model.get('tags').map(function(tag) {
            return { tags: tag.get('_id') };
          })
        },
        success: _.bind(function() { cb.call(this); }, this)
      });
    }
  }, { template: 'tagMap' });

  return TagMapView;
});
