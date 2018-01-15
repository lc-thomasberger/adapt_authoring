// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var TotaraConnectView = require('./views/totaraConnectView');

  Origin.on('origin:dataReady', function() {
    Origin.trigger('configuration:registerView', 'totaraconnect', TotaraConnectView);
  });

  Origin.on('editor:contentObject', function(data) {
    if(data.action === 'edit') {
      return;
    }
    var viewEventName = 'editor' + data.type[0].toUpperCase() + data.type.slice(1);
    Origin.once(viewEventName + ':postRender', function() {
      var $btn = $(Handlebars.partials.part_totaraconnectPublishButton());
      $('.editor-common-sidebar-download').after($btn);
      $btn.click(handlePublish);
    });
  });

  function handlePublish() {
    if (!Helpers.validateCourseContent(Origin.editor.data.course) || Origin.editor.isDownloadPending) {
      return;
    }
    $('.editor-common-sidebar-publish-inner').addClass('display-none');
    $('.editor-common-sidebar-publishing').removeClass('display-none');

    $.get('/totaraconnect/publish/' + Origin.editor.data.course.get('_id'), function(jqXHR, textStatus, errorThrown) {
      Origin.Notify.alert({
        type: 'success',
        text: Origin.l10n.t('app.publishsuccess')
      });
    }).fail(function (jqXHR, textStatus, errorThrown) {
      Origin.Notify.alert({
        type: 'error',
        text: jqXHR.responseText
      });
    });
  }
});
