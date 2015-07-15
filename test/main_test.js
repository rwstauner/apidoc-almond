/*global describe, it */
var Nut    = require('../lib'),
    path   = require('path'),
    fs     = require('fs'),
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
        '--input', path.relative(path.join(__dirname, '..'), testFile('doc')),
        '--output', out,
      ],
      cb: function() {
        fs.readFile(path.resolve(out, 'index.html'), {encoding: 'utf8'}, function(err,data){
          if (err) { throw err; }

          expect( data ).to.match(/<script src="main.opt.js"/);
          done();
        });
      },
    });
  });
});
