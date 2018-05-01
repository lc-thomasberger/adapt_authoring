/**
 * Exposes the log
 **/
var _ = require('underscore');
var fs = require('fs');
var async = require('async');
var winstonMongo = require('winston-mongodb').MongoDB;

var origin = require('../../lib/application')();
var server = module.exports = require('express')();

var COLLECTION_NAME = 'logs';
var DB_LOG_LENGTH = 2048; // in DB
var UI_LOG_LENGTH = 250; // in UI

function initialise(server) {
  origin.logger.add(winstonMongo, {
    db: getDb(),
    collection: COLLECTION_NAME
  });
  trimLogs();
}

initialise();

function getDb() {
  var dbString = 'mongodb://';

  var user = origin.configuration.getConfig('dbUser');
  var pass = origin.configuration.getConfig('dbPass');
  if(user && pass) {
    dbString += user + ':' + pass + '@';
  }
  dbString += origin.configuration.getConfig('dbHost');
  dbString += ':' + origin.configuration.getConfig('dbPort');
  dbString += "/" + origin.configuration.getConfig('dbName');

  return dbString;
};

function getLogs(query, cb) {
  origin.db.retrieve('log', {}, query, cb);
}

function removeLogs(idsToRemove, cb) {
  async.each(idsToRemove, function(id, done) {
    origin.db.destroy('log', { _id: id }, done);
  });
}

// Trims DB logs to DB_LOG_LENGTH, removing oldest first
function trimLogs() {
  getLogs({ operators: { sort: { timestamp: 1 } } }, function(error, logs) {
    if(logs && logs.length > DB_LOG_LENGTH) {
      var noToDelete = logs.length - DB_LOG_LENGTH;
      removeLogs(_.pluck(logs.slice(0, noToDelete), '_id'), function(error) {
        if(error) console.log(error);
      });
    }
  });
};

server.get('/log', function (req, res, next) {
  getLogs({
    jsonOnly: true,
    operators: {
      sort: { timestamp: -1 },
      limit: UI_LOG_LENGTH
    }
  }, function(error, logs) {
    if(error) {
      return res.status(500).json(error.toString());
    }
    res.status(200).json(logs || []);
  });
});
