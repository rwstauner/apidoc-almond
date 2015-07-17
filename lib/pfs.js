var fs = require('fs'),
    Promise = require('promise');

var funcs = [
  'readFile',
  'writeFile',
  'stat',
].reduce(function(mod, func) {
  mod[func] = Promise.denodeify(fs[func]);
  return mod;
}, {});

// Lazy.
funcs.tempdir = function () {
  var temp = require('temp');
  // Remove files at exit.
  temp.track();
  // Replace self with new function.
  funcs.tempdir = Promise.denodeify(temp.mkdir);
  // goto.
  return funcs.tempdir.apply(null, arguments);
};

module.exports = funcs;
