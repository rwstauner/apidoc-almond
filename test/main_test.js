/*global describe, it, before */
var Nut    = require('../lib'),
    pfs    = require('../lib/pfs'),
    path   = require('path'),
    expect = require('chai').expect;

function testFile(basename) {
  return path.resolve(__dirname, 'fixtures', basename);
}

describe('main', function () {

  var test = function (out, done) {
    Nut.main({
      argv: [
        '--silent',
        '--input', path.relative(path.join(__dirname, '..'), testFile('doc')),
        '--output', out,
      ],
    }).then(function () {
      pfs.readFile(path.resolve(out, 'index.html'), {encoding: 'utf8'}).then(
        function (data) {
          expect( data ).to.match(/<script src="main.opt.js"/);
          done();
        }
      ).catch(done);
    }).catch(done);
  };

  it('should build docs and modify index file', function(done) {
    // Takes about 15 seconds to optimize.
    this.slow(16000);
    this.timeout(30000);

    pfs.tempdir('apidoc-almond-test')
      .then(function (dir) { test(dir, done); })
      .catch(done);
  });

  describe('--help', function () {

    var printed = [];

    before(function (done) {
      this.slow(500);
      var n = new Nut({argv: ['--help']});
      n.print = function (msg) { printed.push(msg); };
      n.run().then(function () { done(); }, done);
    });

    it('should print apidoc help message', function () {
      // This is a bit fragile.
      expect( printed ).to.match(/^ +Usage:.+ apidoc /m);
    });

    it('should print our usage message', function () {
      expect( printed ).to.match(/^ +All arguments are passed to apidoc unless --no-apidoc /m);
    });

  });

});
