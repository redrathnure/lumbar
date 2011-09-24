var fs = require('fs'),
    glob = require('glob'),
    lumbar = require('../lib/lumbar'),
    wrench = require('wrench');

function runTest(configFile, expectedDir, beforeExit, assert) {
  var outdir = '/tmp/lumbar-test-' + Date.now() + Math.random();
  console.log('Creating test directory ' + outdir + ' for ' + configFile);
  fs.mkdirSync(outdir, 0755);

  var expectedFiles = glob.globSync(expectedDir + '/**/*.js').map(function(fileName) { return fileName.substring(expectedDir.length); }),
      seenFiles = [];

  var arise = lumbar.init(configFile, {outdir: outdir});
  arise.build(undefined, function(err, status) {
    if (err) {
      throw err;
    }

    var statusFile = status.fileName.substring(outdir.length);
    if (!expectedFiles.some(function(fileName) { return statusFile === fileName; })) {
      assert.fail(undefined, status.fileName, configFile + ':' + statusFile + ': missing from expected list');
    } else {
      seenFiles.push(statusFile);
    }
    if (seenFiles.length < expectedFiles.length) {
      return;
    }

    var generatedFiles = glob.globSync(outdir + '/**/*.js').map(function(fileName) { return fileName.substring(outdir.length); });
    assert.deepEqual(generatedFiles, expectedFiles, configFile + ': file list matches');

    generatedFiles.forEach(function(fileName) {
      var generatedContent = fs.readFileSync(outdir + fileName, 'utf8'),
          expectedContent = fs.readFileSync(expectedDir + fileName, 'utf8');
      assert.equal(generatedContent, expectedContent, configFile + ':' + fileName + ': content matches');
    });
  });

  beforeExit(function() {
    assert.deepEqual(seenFiles, expectedFiles, configFile + ': file list matches');

    // Cleanup
    wrench.rmdirSyncRecursive(outdir);
  });
}

exports['single-file'] = function(beforeExit, assert) {
  runTest('test/artifacts/single-file.json', 'test/expected/single-file', beforeExit, assert);
};
exports['single-dir'] = function(beforeExit, assert) {
  runTest('test/artifacts/single-directory.json', 'test/expected/js-dir', beforeExit, assert);
};
exports['multiple-files'] = function(beforeExit, assert) {
  runTest('test/artifacts/multiple-files.json', 'test/expected/js-dir', beforeExit, assert);
};
