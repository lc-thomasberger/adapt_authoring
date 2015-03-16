// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Component content plugin
 *
 */

var origin = require('../../../'),
    contentmanager = require('../../../lib/contentmanager'),
    rest = require('../../../lib/rest'),
    BowerPlugin = require('../bower'),
    ContentPlugin = contentmanager.ContentPlugin,
    ContentTypeError = contentmanager.errors.ContentTypeError,
    configuration = require('../../../lib/configuration'),
    database = require('../../../lib/database'),
    logger = require('../../../lib/logger'),
    defaultOptions = require('./defaults.json'),
    bower = require('bower'),
    rimraf = require('rimraf'),
    async = require('async'),
    fs = require('fs'),
    ncp = require('ncp').ncp,
    mkdirp = require('mkdirp'),
    _ = require('underscore'),
    helpers = require('../../../lib/helpers'),
    util = require('util'),
    path = require('path');

var bowerConfig = {
  type: 'componenttype',
  keywords: 'adapt-component',
  packageType: 'component',
  srcLocation: 'components',
  options: defaultOptions,
  nameList: [
    "adapt-contrib-text#~1.1",
    "adapt-contrib-narrative#~1.1",
    "adapt-contrib-media#~1.1",
    "adapt-contrib-hotgraphic#~1.1",
    "adapt-contrib-blank#~1.1",
    "adapt-contrib-accordion#~1.1",
    "adapt-contrib-graphic#~1.1",
    "adapt-contrib-matching#~1.1",
    "adapt-contrib-textInput#~1.1",
    "adapt-contrib-mcq#~1.1",
    "adapt-contrib-gmcq#~1.1",
    "adapt-contrib-slider#~1.1"
  ],
  updateLegacyContent: function (newPlugin, oldPlugin, next) {
    database.getDatabase(function (err, db) {
      if (err) {
        return next(err);
      }

      db.retrieve('component', { _componentType: oldPlugin._id }, function (err, docs) {
        async.each(
          docs,
          function (doc, next) {
            db.update('component', { _id: doc._id }, { _componentType: newPlugin._id }, next);
          }, function (err) {
            if (err) {
              logger.log('error', 'Failed to update old documents: ' + err.message, err);
            }

            return next(null);
          });
      });
    });
  }
};

function Component () {
  this.bowerConfig = bowerConfig;
}

util.inherits(Component, BowerPlugin);


/**
 * overrides base implementation of hasPermission
 *
 * @param {string} action
 * @param {object} a content item
 * @param {callback} next (function (err, isAllowed))
 */
Component.prototype.hasPermission = function (action, userId, tenantId, contentItem, next) {
  var self = this;

  app.contentmanager.getContentPlugin('contentobject', function (error, plugin) {
    if (error) {
      return next(error);
    }

    plugin.hasPermission(action, userId, tenantId, contentItem, function (error, isAllowed) { 
      if (error) {
        return next(error);
      }

      return next(null, isAllowed);
    });
  });
};

/**
 * implements ContentObject#getModelName
 *
 * @return {string}
 */
Component.prototype.getModelName = function () {
  return 'component';
};

/**
 * returns the plugin type identifier for this plugin
 *
 * @return {string}
 */
Component.prototype.getPluginType = function () {
  return 'componenttype';
};

/**
 * add content schema to the database via this function
 *
 * @param {object} db
 * @param {callback} next
 */
Component.prototype.onDatabaseCreated = function (db, next) {
  var self = this;
  BowerPlugin.prototype.onDatabaseCreated.call(self, db, function (err) {
    if (err) {
      return next(err);
    }

    ContentPlugin.prototype.onDatabaseCreated.call(self, db, next);
  });
};

/**
 * Overrides base.retrieve
 *
 * @param {object} search
 * @param {object} options
 * @param {callback} next
 */
Component.prototype.retrieve = function (search, options, next) {
  // shuffle params
  if ('function' === typeof options) {
    next = options;
    options = {};
  }

  ContentPlugin.prototype.retrieve.call(this, search, options, next);
};

Component.prototype.update = function (search, delta, next)  {
  var self = this;

  self.retrieve(search, function (error, docs) {
    if (error) {
      return next(error);
    }

    if (docs.length) {
      // Ensure that _courseId is included
      if (docs[0]._courseId && !delta.hasOwnProperty('_courseId')) {
        delta._courseId = docs[0]._courseId;
      }

      ContentPlugin.prototype.update.call(self, search, delta, function (error) {
        if (error) {
          return next(error);
        }

        next(null);
      });
    } else {
      next(null);
    }
  });
};

/**
 * essential setup
 *
 * @api private
 */
function initialize () {
  BowerPlugin.prototype.initialize.call(new Component(), bowerConfig);
}


// setup components
initialize();

/**
 * Module exports
 *
 */

exports = module.exports = Component;
