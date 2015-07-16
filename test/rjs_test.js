/*global describe, it */
var Nut    = require('../lib'),
    pfs    = require('../lib/pfs'),
    path   = require('path'),
    expect = require('chai').expect;

describe('requirejs', function () {

  it('should not attempt r.js when no main.js is present', function(done) {
    // Should abort early.
    this.timeout(2000);
    var out = '/tmp/apidoc-almond/should/not.exist';
    Nut.main({
      argv: [
        '--silent',
        '--no-apidoc',
        '--output', out,
      ],
    }).then(function () {
      // Failure.
      done(new Error("Expected error, got none."));
    }, function (err) {
      // This is our success case.
      expect( err.message ).to.equal('Cannot optimize; not found: "' + path.join(out, 'main.js') + '"');
      done();
    }).catch(done); // End suite on error.
  });

});
