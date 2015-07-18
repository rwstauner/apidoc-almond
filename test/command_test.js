/*global describe, it, before */
var Nut    = require('../lib'),
    expect = require('chai').expect;

describe('command', function () {

  it('should mention module and command if not found', function (done) {
    new Nut()._command('apidoc-almond/a/bad/value')
    .catch(function (err) {
      expect( err.message ).to.equal('Command "value" not found.  Is "apidoc-almond" installed?');
      done();
    }).catch(done);
  });

});
