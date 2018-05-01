// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var ContentCollection = require('core/collections/contentCollection');
  var TagCollection = Backbone.Collection.extend({ url: '/api/content/tag' });

  var TAG_PREFIX = '(p|m)-';

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
          this.render();
        });
      });
    },

    fetchTags: function(cb) {
      this.model.get('tags').fetch({
        data: { title: { $regex: '^' + TAG_PREFIX } },
        success: _.bind(function(tags) {
          this.processTags(tags);
          cb.apply(this);
        }, this)
      });
    },

    processTags: function(tags) {
      var m = [], p = [];
      tags.each(function(tag) {
        (tag.get('title')[0] === 'p') ? p.push(tag) : m.push(tag);
      });
      this.model.set({ moduleTags: m, projectTags: p });
    },

    fetchCourses: function(cb) {
      this.model.get('courses').fetch({
        data: {
          $or: this.model.get('tags').map(function(tag) {
            return { tags: tag.get('_id') };
          })
        },
        success: _.bind(function(courses) {
          this.processCourses(courses);
          cb.apply(this);
        }, this)
      });
    },

    processCourses: function(courses) {
      courses.each(function(course) {
        var mTag;
        course.get('tags').forEach(function(tag) {
          if(this.model.get('moduleTags').indexOf(tag._id)) {
            mTag = tag;
            return;
          }
        }, this);
        course.set('moduleTag', mTag);
      }, this);
      this.model.get('projectTags').forEach(function(tag) {
        tag.set('courses', courses.filter(function(course) {
          return this.doesCourseHaveTag(course, tag);
        }, this));
      }, this);
    },

    doesCourseHaveTag: function(course, tag) {
      var ret = false;
      course.get('tags').forEach(function(courseTag) {
        if(courseTag._id === tag.get('_id')) return ret = true;
      });
      return ret;
    }
  }, { template: 'tagMap' });

  return TagMapView;
});
