var fs = require('fs'),
    glob = require('glob'),
    lib = require('./lib'),
    lumbar = require('../lib/lumbar'),
    wrench = require('wrench');

function appendSpace(path) {
  setTimeout(function() {
    console.error('append:', path);
    var fd = fs.openSync(path, 'a');
    fs.writeSync(fd, ' ');
    fs.closeSync(fd);
  }, 1000);
}
function appendRapidSpace(path1, path2) {
  setTimeout(function() {
    console.error('append rapid:', path1, path2);
    var fd = fs.openSync(path1, 'a');
    fs.writeSync(fd, ' ');
    fs.closeSync(fd);

    var fd = fs.openSync(path2, 'a');
    fs.writeSync(fd, ' ');
    fs.closeSync(fd);
  }, 1000);
}
function runWatchTest(name, srcdir, config, operations, expectedFiles, expectedDir, beforeExit, assert) {
  var testdir = lib.testDir(name, 'example'),
      outdir = lib.testDir(name, 'test'),
      seenFiles = [];
  wrench.copyDirSyncRecursive(srcdir, testdir);

  var arise = lumbar.init(testdir + '/' + config, {packageConfigFile: 'config/dev.json', outdir: outdir});
  arise.watch(undefined, function(err, status) {
    if (err) {
      throw err;
    }

    var statusFile = status.fileName.substring(outdir.length);
    console.error(statusFile);
    if (!expectedFiles.some(function(fileName) { return statusFile === fileName; })) {
      arise.unwatch();
      assert.fail(undefined, status.fileName,  'watchFile:' + statusFile + ': missing from expected list');
    } else {
      seenFiles.push(statusFile);
    }
    operations[seenFiles.length] && operations[seenFiles.length](testdir);
    if (seenFiles.length < expectedFiles.length) {
      return;
    }

    arise.unwatch();

    lib.assertExpected(outdir, expectedDir, 'watchfile', assert);

    // Cleanup (Do cleanup here so the files remain for the failure case)
    wrench.rmdirSyncRecursive(testdir);
    wrench.rmdirSyncRecursive(outdir);
  });

  beforeExit(function() {
    seenFiles = seenFiles.sort();
    expectedFiles = expectedFiles.sort();
    assert.deepEqual(seenFiles, expectedFiles, 'watchFile: seen file list matches');
  });
}

exports['watch-script'] = function(beforeExit, assert) {
  var expectedFiles = [
          '/android/native-home.js', '/iphone/native-home.js', '/web/base.js', '/web/home.js',
          '/android/native-home.js', '/iphone/native-home.js', '/web/base.js', '/web/home.js',
          '/android/native-home.js', '/iphone/native-home.js',
          '/android/native-home.js', '/iphone/native-home.js',
          '/android/native-home.js', '/iphone/native-home.js', '/web/home.js'
        ],
      operations = {
        4: function(testdir) {
          // Modify the config file
          appendSpace(testdir + '/lumbar.json');
        },
        8: function(testdir) {
          // Modify the bridge file
          appendSpace(testdir + '/js/bridge.js');
        },
        10: function(testdir) {
          appendRapidSpace(testdir + '/js/bridge.js', testdir + '/js/bridge-iphone.js');
        },
        12: function(testdir) {
          // Modify the home template
          appendSpace(testdir + '/templates/home/home.handlebars');
        }
      };

  runWatchTest(
    'watch-script', 'example', 'lumbar.json',
    operations, expectedFiles, 'test/expected/example',
    beforeExit, assert);
};
