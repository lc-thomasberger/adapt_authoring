var auth = require('../../lib/auth');
var fs = require('fs-extra');
var configuration = require('../../lib/configuration');
var logger = require('../../lib/logger');
var origin = require('../../lib/application')();
var path = require('path');
var permissions = require('../../lib/permissions');
var OutputConstants = require('../../lib/outputmanager').Constants;

var Constants = require('./constants');
var SuccessConsts = Constants.Messages.Success;
var ErrorConsts = Constants.Messages.Fail;
var errors = require('./errors');
var token = require('./token');

module.exports = {
  crudWrapper: function(router) {
    return {
      get: function(route, callback) {
        router.route(route).get(callback);
      },
      put: function(route, callback) {
        router.route(route).put(callback);
      },
      post: function(route, callback) {
        router.route(route).post(callback);
      },
      delete: function(route, callback) {
        router.route(route).delete(callback);
      }
    };
  },
  authenticate: function(req, res, next) {
    var tokenVal = decodeAuthHeader(req).token;
    var tokenPermissions = {
      action: 'read',
      route: `/${Constants.Route}`
    };
    token.authenticate(tokenVal, tokenPermissions, function(error, tokenData) {
      if(error) return next(error);
      req.tokenData = tokenData;
      next();
    });
  },
  memoiseUser: function(req, res, next) {
    origin.usermanager.retrieveUser({ _id: req.tokenData.user }, { jsonOnly: true }, function(error, user) {
      if(error) {
        return next(errors.ServerError(error));
      }
      if(!user) {
        return next(errors.AuthorisationError(ErrorConsts.UserAuth));
      }
      req.user = user;
      next();
    });
  },
  generateToken: function(req, res, next) {
    var _generateTokenDelegate = function(userData) {
      var now = new Date();
      var tokenData = {
        user: userData._id,
        _tenantId: userData._tenantId,
        createdAt: new Date(),
        // FIXME set to +100 years, may as well not bother...
        expiresAt: new Date(now.setYear(now.getFullYear()+100))
      };
      token.generate(tokenData, function(error, token) {
        if(error) return next(error);
        res.status(200).send(token);
      });
    };
    // if request is from the client, we'll have the user already
    if(req.user) {
      return _generateTokenDelegate(req.user);
    }
    // request hasn't come from the client, so expect basic auth
    var headerData = decodeAuthHeader(req);
    var creds = new Buffer(headerData.token, 'base64').toString().split(':');
    var email = creds[0];
    var password = creds[1];
    auth.getAuthPlugin('local', function(error, plugin) {
      plugin.verifyUser(email, password, function(error, isValid, data) {
        if(!isValid) {
          return next(new errors.AuthorisationError(data.message));
        }
        origin.usermanager.retrieveUser({ email: email }, function(error, user) {
          _generateTokenDelegate(user);
        });
      });
    });
  },
  getTokens: function(req, res, next) {
    if(!req.user) {
      return next(errors.AuthorisationError(ErrorConsts.UserAuth));
    }
    origin.db.retrieve('token', { user: req.user._id }, function(error, results) {
      if(error) {
        return next(errors.ServerError(error));
      }
      res.status(200).json(_.map(results, function(item) {
        return {
          _id: item._id,
          createdAt: item.createdAt,
          expiresAt: item.expiresAt
        };
      }));
    });
  },
  deleteToken: function(req, res, next) {
    if(!req.user) {
      return next(token.AuthorisationError(ErrorConsts.UserAuth));
    }
    // make sure we only try to delete tokens owned by the request user
    origin.db.destroy('token', { _id: req.params.id, user: req.user._id }, function(error, results) {
      if(error) {
        return next(errors.ServerError(error));
      }
      res.status(200).send(SuccessConsts.TokenRevoke);
    });
  },
  testConnection: function(req, res, next) {
    res.status(200).send(SuccessConsts.ConnectionTest);
  },
  getCourses: function(req, res, next) {
    var whitelistedAttributes = [ // NOTE defined like this for readability...
      '_id',
      'title',
      'description',
      'tags',
      'createdAt',
      'updatedAt',
      'publishedAt'
    ].join(' ');
    // NOTE we populate the course with the needed data
    origin.db.retrieve('publishedcourse', { _tenantId: req.user._tenantId }, { populate: { course: whitelistedAttributes } }, function(error, results) {
      if(error) {
        return next(errors.ServerError(error));
      }
      // return the populated data and add the publish time
      res.status(200).json(_.map(results, function(item) {
        return _.extend(item.course, { publishedAt: item.publishedAt });
      }));
    });
  },
  publishCourse: function(req, res, next) {
    var courseId = req.params.id;
    canViewCourse(req.user, courseId, function(error) {
      if(error) { // will return error if we don't have permission
        return next(error);
      }
      origin.contentmanager.getContentPlugin('config', function(error, configPlugin) {
        configPlugin.retrieve({ _courseId: courseId }, { tenantId: req.user._tenantId }, function(error, results) {
          if(error) {
            return next(errors.ServerError(error));
          }
          if(results.length === 0) {
            return next(errors.RequestError(ErrorConsts.NoCourse));
          }
          var enabledExtensions = results[0]._enabledExtensions;
          if(!enabledExtensions || !enabledExtensions.spoor) {
            return next(errors.RequestError(ErrorConsts.NoSpoor));
          }
          origin.outputmanager.getOutputPlugin(app.configuration.getConfig('outputPlugin'), function(error, plugin) {
            if(error) return next(errors.ServerError(error));

            plugin.publish(courseId, OutputConstants.Modes.publish, req, res, function(error, result) {
              if(error) return next(errors.ServerError(error));

              var newDest = result.filename.replace(OutputConstants.Filenames.Download, Constants.Filenames.Publish);
              fs.copy(result.filename, newDest, { overwrite: true }, function(error) {
                if(error) return next(errors.ServerError(error));

                var modelName = 'publishedcourse';
                var query = { course: courseId };
                var data = {
                  course: courseId,
                  _tenantId: req.user._tenantId,
                  publishedAt: new Date()
                };
                var _callback = function(error, results) {
                  if(error) return next(errors.ServerError(error));
                  res.status(200).send(SuccessConsts.Publish);
                };
                origin.db.retrieve(modelName, query, function(error, results) {
                  if(error) {
                    return next(errors.ServerError(error));
                  }
                  if(!results || results.length === 0) {
                    return origin.db.create(modelName, data, _callback);
                  }
                  origin.db.update(modelName, query, data, _callback);
                });
              });
            });
          });
        });
      });
    });
  },
  getScorm: function(req, res, next) {
    var courseId = req.params.id;
    canViewCourse(req.user, courseId, function(error) {
      if(error) { // will return error if we don't have permission
        return next(error);
      }
      origin.db.retrieve('publishedcourse', { course: courseId }, function(error, results) {
        if(error) {
          return next(errors.ServerError(error));
        }
        if(results.length === 0) {
          return next(errors.RequestError(ErrorConsts.UnknownCourse, 404));
        }
        var zipPath = path.join(
          configuration.tempDir,
          configuration.getConfig('masterTenantID'),
          OutputConstants.Folders.Framework,
          OutputConstants.Folders.AllCourses,
          results[0]._tenantId.toString(),
          courseId,
          Constants.Filenames.Publish
        );
        fs.stat(zipPath, function(error, stat) {
          if(error) {
            return next(errors.ServerError(error));
          }
          res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Length': stat.size,
            'Content-disposition': `attachment; filename=${courseId + Constants.Filenames.SCORM}`,
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          fs.createReadStream(zipPath).pipe(res);
        });
      });
    });
  }
};

function decodeAuthHeader(req) {
  if(!req.headers.authorization) {
    return '';
  }
  var header = req.headers.authorization.split(' ');
  return {
    type: header[0],
    token: header[1]
  };
}

function canViewCourse(user, courseId, cb) {
  if(!courseId) {
    return next(errors.RequestError(ErrorConsts.NoCourse));
  }
  permissions.hasPermission(user._id, 'read', permissions.buildResourceString(user._tenantId, `/api/course/${courseId}`), function(error, hasPermission) {
    if(error) {
      return cb(errors.ServerError(error));
    }
    if(!hasPermission) {
      return cb(errors.AuthorisationError(`${ErrorConsts.CoursePerm}: ${courseId}`));
    }
    cb();
  });
}
