// NPM includes
var _ = require('underscore');
var exec = require('child_process').exec;
var fs = require('fs-extra');
var path = require('path');
var rest = require('../../lib/rest');
// export needed by router.js
var server = module.exports = require('express')();
// local includes
var origin = require('../../lib/application')();
var OutputConstants = require('../../lib/outputmanager').Constants;

server.get('/systemInfo', function (req, res, next) {
  async.parallel([
    function framework(cb) {
      getFrameworkData(cb);
    },
    function server(cb) {
      getServerData(cb);
    }
  ], function(error, data) {
    if(error) return next(error);
    // concat all data
    res.status(200).json(_.reduce(data, function(memo, item) { return _.extend(memo, item); }, {}));
  });
});

function getFrameworkData(cb) {
  var packagePath = path.join(
    OutputConstants.Folders.Temp,
    origin.usermanager.getCurrentUser().tenant._id,
    OutputConstants.Folders.Framework,
    OutputConstants.Filenames.Package
  );
  fs.readJson(packagePath, function(error, packageObj) {
    cb(error, {
      'Framework Version': packageObj.version
    });
  });
}

function getServerData(cb) {
  // get branch info
  var child = exec("git branch -vv", function(error, stdout, stderr) {
    if(error) return cb(error);
    if (stderr.length !== 0) return cb(stderr);
    if (stdout.length === 0) return cb(null, {});

    var data = {};

    // just pull out the latest for the current branch
    var statusInfo = stdout.match(/\* (.+)/)[1];

    var localBranch = statusInfo.match(/^(\S+)\s+/)[1];
    statusInfo = statusInfo.replace(localBranch,'');

    var commit = statusInfo.match(/^\s*(\S+)/)[1];
    statusInfo = statusInfo.replace(commit,'');

    var trackingBranchMatch = statusInfo.match(/^\s*(\[\S+\])/);
    var message = statusInfo.match(/^\s*(.+)/)[1]; // not used

    data['Origin Version'] = commit;

    if(!trackingBranchMatch) {
      data['Origin Branch'] = localBranch + ' (untracked)';
      return cb(null, data);
    }

    var trackingBranch =  trackingBranchMatch[1].slice(1,-1);
    statusInfo = statusInfo.replace(trackingBranchMatch[1],'');

    remoteParts = trackingBranchMatch[1].slice(1,-1).split('/');

    var remote = remoteParts.splice(0,1);

    data['Origin Branch'] = remoteParts.join('/');

    // get the remote
    child = exec("git remote get-url " + remote, function(error, stdout, stderr) {
      if(error) return cb(error);
      if (stderr.length != 0) return cb(stderr);
      if (stdout.length === 0) return cb(null, {});

      data['Origin Repository'] = stdout.replace('\n','');

      cb(null, data);
    });

  });
}
