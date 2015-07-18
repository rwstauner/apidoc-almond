/*global describe, it, before */
var Nut    = require('../lib'),
    expect = require('chai').expect;

describe('methods', function () {

  describe('verbose', function () {
    var printed = function (opts) {
      var n = new Nut(opts);
      var text = '';
      n.print = function (msg) { text += msg; };
      n.verbose('hi');
      return text;
    };

    it('should print if not silent', function () {
      expect( printed() ).to.equal('hi');
    });

    it('should not print if silent', function () {
      expect( printed({silent: true}) ).to.equal('');
    });

  });

});
