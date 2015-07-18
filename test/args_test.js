/*global describe, it */
var Nut    = require('../lib'),
    expect = require('chai').expect;

describe('args', function () {
  var parse = function (argv) {
    return new Nut({argv: (argv || [])}).opts;
  };

  describe('apidoc', function () {
    it('should be true by default', function () {
      expect( parse().apidoc ).to.be.true;
    });

    it('should disable with --no...', function(){
      expect( parse(['--no-apidoc']).apidoc ).to.be.false;
    });
  });

  describe('silent', function () {
    it('defaults to false', function () {
      expect( (new Nut()).silent ).to.be.undefined;
    });
    it('can be passed in', function () {
      expect( (new Nut({silent: true})).silent ).to.be.true;
    });
    it('comes from args', function () {
      expect( (new Nut({argv: ['--silent']})).silent ).to.be.true;
    });
  });

  describe('pass through to apidoc', function () {
    var passed = function(argv) {
      var n = new Nut({argv: argv});
      var meth = '_command';

      expect(n[meth]).to.be.a('function');

      var got;
      n[meth] = function () { got = arguments[1]; };
      n.apidoc();

      return got;
    };

    it('works with all option styles', function () {
      var str = '--silent --input=X -a -b 1 2';
      expect( passed(str.split(' ')).join(' ') ).to.equal( str );
    });
  });
});
