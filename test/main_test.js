/*global describe, it */
var Nut    = require('../lib'),
    pfs    = require('../lib/pfs'),
    path   = require('path'),
    expect = require('chai').expect;

function testFile(basename) {
  return path.resolve(__dirname, '..', 'tmp', 'data', basename);
}

describe('main', function () {
  it('should modify the index file', function(done) {
    // Takes about 15 seconds to optimize.
    this.timeout(30000);

    var out = testFile('out');
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
  });
});
