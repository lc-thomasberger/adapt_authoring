// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var SysadminView = require('plugins/sysadmin/views/sysadminPluginView');
  var TagCollection = Backbone.Collection.extend({ url: '/api/content/tag' });
  var TagEditView = require('./tagEditView');

  var TagManagerView = SysadminView.extend({
    name: 'tagmanager',
    settings: {
      autoRender: false
    },

    initialize: function(options) {
      this.model = new Backbone.Model({ tags: new TagCollection() });
      this.listenTo(Origin, 'tags:refresh', this.preRender);

      SysadminView.prototype.initialize.apply(this, arguments);
    },

    preRender: function() {
      this.model.get('tags').fetch({ success: _.bind(this.render, this) });
    },

    postRender: function() {
      $('.tag', this.$el).click(_.bind(this.onTagClick, this));
    },

    onTagClick: function(event) {
      event && event.preventDefault();
      if($('.tagEdit').length) {
        return;
      }
      var tagData = this.model.get('tags').findWhere({ _id: $(event.currentTarget).attr('data-id') });
      var view = new TagEditView({ tag: tagData });
      $('body').append(view.$el);
    }
  }, { template: 'tagManager' });

  return TagManagerView;
});
