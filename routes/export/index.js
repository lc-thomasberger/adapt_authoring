var fs = require('fs');
var server = module.exports = require('express')();
var configuration = require('../../lib/configuration');
var Constants = require('../../lib/outputmanager').Constants;
var helpers = require('../../lib/helpers');
var logger = require('../../lib/logger');
var path = require('path');
var permissions = require('../../lib/permissions');
var usermanager = require('../../lib/usermanager');
var util = require('util');

function ExportPermissionError(message, httpCode) {
  this.message = message || "Permission denied";
  this.http_code = httpCode || 401;
}
util.inherits(ExportPermissionError, Error);

// stop any auto permissions checks
permissions.ignoreRoute(/^\/export\/?.*$/);

server.get('/export/:tenant/:course', function (req, res, next) {
  var course = req.params.course;
  var tenant = req.params.tenant;
  var currentUser = usermanager.getCurrentUser();

  helpers.hasCoursePermission('', currentUser._id, tenant, {_id: course}, function(err, hasPermission) {
    if (err || !hasPermission) {
      return next(err || new ExportPermissionError());
    }

    if (currentUser && (currentUser.tenant._id == tenant)) {
      var outputplugin = app.outputmanager.getOutputPlugin(configuration.getConfig('outputPlugin'), function (error, plugin){
        if (error) {
          logger.log('error', error);
          res.statusCode = 500;
          return res.json({
            success: false,
            message: error.message
          });
        } else {
          plugin.export(course, req, res, function (error, result) {
            if (error) {
              logger.log('error', 'Unable to export:', error);
              res.statusCode = 500;
              return res.json({
                success: false,
                message: error.message
              });
            }

            result.success = true;
            result.message = app.polyglot.t('app.exportcoursesuccess');
            res.statusCode = 200;
            return res.json(result);
          });
        }
      });
    } else {
      res.statusCode = 401;
      return res.json({
        success: false,
        message: app.polyglot.t('app.errorusernoaccess')
      });
    }
  });
});
// TODO probably needs to be moved to download route
server.get('/export/:tenant/:course/:title/download.zip', function (req, res, next) {
  var tenantId = req.params.tenant;
  var courseId = req.params.course;
  var userId = usermanager.getCurrentUser()._id;
  var zipName = req.params.title;
  // TODO don't like having to specify this here AND in plugins/output/adapt.export->getCourseName()-exportDir
  var zipDir = path.join(
    configuration.tempDir,
    configuration.getConfig('masterTenantID'),
    Constants.Folders.Framework,
    Constants.Folders.Exports,
    zipName
  );

  fs.stat(zipDir, function(err, stat) {
    if (err) {
      next(err);
    } else {
      res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-Length': stat.size,
          'Content-disposition' : 'attachment; filename=' + zipName,
          'Pragma' : 'no-cache',
          'Expires' : '0'
      });

      var readStream = fs.createReadStream(zipDir);
      readStream.pipe(res);
    }
  });
});

server.get('/exportHtml/:tenant/:course', function(req, res) {
  var user = usermanager.getCurrentUser();
  var tenantId = req.params.tenant;
  var courseId = req.params.course;

  helpers.hasCoursePermission('', user._id, tenantId, { _id: courseId }, function(err, hasPermission) {
    if (err || !hasPermission) {
      return handleError(err || new ExportPermissionError(), res);
    }
    if (!user || user.tenant._id !== tenantId) {
      return res.status(401).json({
        success: false,
        message: app.polyglot.t('app.errorusernoaccess')
      });
    }
    var outputPluginName = configuration.getConfig('outputPlugin');

    app.outputmanager.getOutputPlugin(outputPluginName, function(err, plugin) {
      if (err) {
        return handleError(err, res);
      }
      plugin.exportHtml(courseId, req, res, function(err, result) {
        return err ? handleError(err, res) : res.status(200).json({
          success: true,
          message: app.polyglot.t('app.exportcoursesuccess'),
          courseTitle: result.courseTitle
        });
      });
    });
  });
});

server.get('/downloadHtml/:courseTitle/download.zip', function (req, res) {
  var folders = Constants.Folders;
  var zipPath = path.join(
    configuration.tempDir,
    configuration.getConfig('masterTenantID'),
    folders.Framework,
    folders.Exports,
    usermanager.getCurrentUser()._id + '.zip'
  );
  var courseTitle = req.params.courseTitle;
  var isoDate = new Date().toISOString();
  var timestamp = isoDate.replace('T', '-').replace(/:/g, '').substr(0, 17);
  var zipName = helpers.slugify('adapt2html', courseTitle, timestamp) + '.zip';

  fs.stat(zipPath, function(err, stat) {
    if (err) {
      return handleError(err, res);
    }
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Length': stat.size,
      'Content-disposition': 'attachment; filename=' + zipName,
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    fs.createReadStream(zipPath).pipe(res);
  });
});
