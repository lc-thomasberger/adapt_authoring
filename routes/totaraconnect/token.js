var async = require('async');
var jwt = require('jsonwebtoken');
var configuration = require('../../lib/configuration');
var origin = require('../../lib/application')();
var permissions = require('../../lib/permissions');
var usermanager = require('../../lib/usermanager');
// only allow certain attributes to be added to a jwt
var whitelistedAttributes = [
  "_id",
  "_tenantId",
];

var exports = module.exports = {
  AuthorisationError: function(message) {
    var error = new Error();
    error.name = 'AuthorisationError';
    error.message = message;
    return error;
  },
  generate: function(data, cb) {
    var _handleError = function(error) {
      cb(new Error(`Failed to generate authorisation token, ${error}`));
    };
    if(!data) {
      return cb(`Didn't generate token, no data passed`);
    }
    // generate a valid jwt
    jwt.sign(_.pick(data, whitelistedAttributes), configuration.getConfig('jwtSecret'), function(error, token) {
      if(error) return _handleError(error);
      origin.db.create('token', data, function(error, doc) {
        cb(error, { _id: doc._id, token: token });
      });
    });
  },
  authenticate: function(token, permissionData, cb) {
    if(!token) {
      return cb(new exports.AuthorisationError(`Expected an authorisation token, received ${token}`));
    }
    jwt.verify(token, configuration.getConfig('jwtSecret'), function(error, decodedData) {
      if(error) {
        return cb(new exports.AuthorisationError(`Authorisation token is not valid, ${error.message}`));
      }
      if(!decodedData._id || !decodedData._tenantId) {
        return cb(new exports.AuthorisationError(`Token data is not valid`));
      }
      var resource = permissions.buildResourceString(decodedData._tenantId, permissionData.route);
      permissions.hasPermission(decodedData._id, permissionData.action, resource, function(error, hasPermission) {
        if(error || !hasPermission) {
          return cb(new exports.AuthorisationError('Failed permissions check'));
        }
        cb(null, decodedData);
      });
    });
  }
};
