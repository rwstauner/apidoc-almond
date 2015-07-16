var fs = require('fs'),
    Promise = require('promise');

module.exports = [
  'readFile',
  'writeFile',
  'stat',
].reduce(function(mod, func) {
  mod[func] = Promise.denodeify(fs[func]);
  return mod;
}, {});
