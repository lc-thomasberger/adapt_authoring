// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Backbone = require('backbone');
  var OriginView = require('core/views/originView');

  var TagEditView = OriginView.extend({
    className: 'tagEdit',
    events: {
      'click button[name="save"]': 'onSaveClicked',
      'click button[name="cancel"]': 'onCancelClicked',
      'click button[name="delete"]': 'onDeleteClicked',
      'change input': 'onInputChange'
    },

    preRender: function(options) {
      if(options) {
        this.model = options.tag;
      }
    },

    doReq: function(method, data) {
      $.ajax({
        method: method,
        url: '/api/content/tag/' + this.model.get('_id'),
        data: data,
        success: _.bind(function(data) {
          Origin.trigger('tags:refresh');
          this.onCancelClicked();
        }, this),
        error: function(jqXHR, textStatus, errorThrown) {
          Origin.Notify.alert({
            type: 'error',
            text:  Origin.l10n.t('app.deletetagfail', { error: errorThrown })
          });
        }
      });
    },

    onInputChange: function() {
      $('.error', this.$el).text('');
    },

    onSaveClicked: function(event) {
      event && event.preventDefault();
      var newTitle = $('input', this.$el).val();

      if(_.isEmpty(newTitle)) {
        $('.error', this.$el).text(Origin.l10n.t('app.tagisempty'));
        return;
      }
      if(newTitle === this.model.get('title')) {
        this.onCancelClicked();
        return;
      }
      this.doReq('PUT', { title: newTitle });
    },

    onCancelClicked: function(event) {
      event && event.preventDefault();
      this.remove();
    },

    onDeleteClicked: function(event) {
      event && event.preventDefault();
      Origin.Notify.confirm({
        type: 'warning',
        text: Origin.l10n.t('app.confirmdeletetag'),
        callback: _.bind(this.onDeleteConfirmed, this)
      });
    },

    onDeleteConfirmed: function(confirmed) {
      if(confirmed !== true) {
        return;
      }
      this.doReq('DELETE');
    }
  }, { template: 'tagEdit' });

  return TagEditView;
});
