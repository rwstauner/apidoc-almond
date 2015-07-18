/*global describe, it */
var Nut    = require('../lib'),
    pfs    = require('../lib/pfs'),
    path   = require('path'),
    expect = require('chai').expect;

function testFile(basename) {
  return path.resolve(__dirname, 'fixtures', basename);
}

describe('requirejs', function () {

  it('should not attempt r.js when no main.js is present', function(done) {
    // Should abort early.
    this.timeout(2000);
    var out = '/tmp/apidoc-almond/should/not.exist';
    new Nut({
      argv: [
        '--silent',
        '--no-apidoc',
        '--output', out,
      ],
    }).run()
    .then(function () {
      // Failure.
      done(new Error("Expected error, got none."));
    }, function (err) {
      // This is our success case.
      expect( err.message ).to.equal('Cannot optimize; not found: "' + path.join(out, 'main.js') + '"');
      done();
    }).catch(done); // End suite on error.
  });

  it('should propagate the original error for any other case', function(done) {
    this.slow(600);
    var out = testFile('badout');

    // We stat the file and provide a nicer message if it doesn't exist.
    // Don't change the message if some other file doesn't exist.
    // In this case the main.js exists
    // but the index.html to be munged afterwards does not.

    (new Nut({
      dir: out,
      silent: true,
    })).rjs()
    .then(function () {
      // Failure.
      done(new Error("Expected error, got none."));
    }, function(err) {
      // Success?
      expect( err.message ).to.not.match(/Cannot optimize;/);
      expect( err.code ).to.equal('ENOENT');
      done();
    })
    .catch(done);
  });

});
