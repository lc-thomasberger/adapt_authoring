// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var AssetModel = require('./models/assetModel');
  var AssetCollection = require('./collections/assetCollection');
  var AssetManagementView = require('./views/assetManagementView');
  var AssetManagementSidebarView = require('./views/assetManagementSidebarView');
  var AssetManagementNewAssetView = require('./views/assetManagementNewAssetView');
  var AssetManagementNewAssetSidebarView = require('./views/assetManagementNewAssetSidebarView');
  var CourseCollection = require('core/collections/courseCollection');
  var TagsCollection = require('core/collections/tagsCollection');

  Origin.on('origin:dataReady login:changed', function() {
    Origin.globalMenu.addItem({
      "location": "global",
      "text": Origin.l10n.t('app.assetmanagement'),
      "icon": "fa-file-image-o",
      "callbackEvent": "assetManagement:open",
      "sortOrder": 2
    });
  });

  Origin.on('globalMenu:assetManagement:open', function() {
    Origin.router.navigateTo('assetManagement');
  });

  Origin.on('router:assetManagement', function(location, subLocation, action) {
    Origin.assetManagement = {
      filterData: {}
    };
    if(!location) {
      loadCollectionView();
    }
    else if(location === 'new') {
      loadAssetView();
    }
    else if(subLocation === 'edit'){
      loadAssetView(location);
    }
  });

  function loadCollectionView() {
    (new TagsCollection()).fetch({
      success: function(tags) {
        // Sidebar also needs access to collection, so create now. Fetch is done
        // in collectionView (thanks to server-side filtering)
        Origin.trigger('location:title:hide');
        Origin.sidebar.addView(new AssetManagementSidebarView({ collection: tags }).$el);
        Origin.contentPane.setView(AssetManagementView, { collection: new AssetCollection() });
        Origin.trigger('assetManagement:loaded');
      },
      error: handleError
    });
  }

  function loadAssetView(id) {
    var isNew = id === undefined;
    // TODO localise this
    var title = isNew ? 'New Asset' : 'Edit Asset';
    Origin.trigger('location:title:update', { title: title} );

    var data = isNew ? {} : { _id: id };
    var model = new AssetModel(data);
    // needed for filtering
    (new CourseCollection()).fetch({
      success: function(courses) {
        model.set('projects', filterProjects(courses));
        if(isNew) loadView();
        else model.fetch({ success: loadView });
      }
    });

    function loadView() {
      Origin.sidebar.addView(new AssetManagementNewAssetSidebarView().$el, {
        "backButtonText": "Back to assets",
        "backButtonRoute": "/#/assetManagement"
      });
      Origin.contentPane.setView(AssetManagementNewAssetView, { model: model });
    };
  }

  // filters out projects that aren't 'mine' OR shared
  // @return just the  _ids and titles
  function filterProjects(projects) {
    return projects.filter(function(project) {
      var shared = project.get('_isShared') === true;
      var mine = project.get('createdBy') === Origin.sessionModel.get('_id');
      return shared || mine;
    }).map(function(project) {
      return {
        _id: project.get('_id'),
        title: project.get('title')
      };
    });
  }

  function handleError() {
    // TODO localise this
    Origin.Notify.alert({
      type: 'error',
      text: 'An error occured fetching data - try refreshing your page'
    });
  }
});
