/*global describe, it, before */
var Nut    = require('../lib'),
    expect = require('chai').expect;

describe('command', function () {

  var not_found_re = /^Command \S+ not found/;

  it('should mention module and command if not found', function (done) {
    new Nut()._command('apidoc-almond/a/bad/value')
    .catch(function (err) {
      // General (use the same re for negation test later).
      expect( err.message ).to.match(not_found_re);
      // Specific.
      expect( err.message ).to.equal('Command "value" not found.  Is "apidoc-almond" installed?');
      done();
    }).catch(done);
  });

  it('should rethrow other errors', function (done) {
    // Something that require() will barf on.
    var badreqval = null;

    new Nut()._command(badreqval)
      .catch(function (err) {
        expect( err.message ).to.not.match(not_found_re);
        done();
      }).catch(done);
  });

});
