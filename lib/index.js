/*jslint node: true */

var fs = require('fs'),
    path = require('path'),
    child_process = require('child_process');

function extend (dest) {
  var key, i, src;
  for(i = 0; i < arguments.length; ++i){
    src = arguments[i];
    for(key in src){
      if( src.hasOwnProperty(key) ){
        dest[key] = src[key];
      }
    }
  }
  return dest;
}

function Nut (options) {
  extend(this,
    // defaults
    {
      // Strip exec args (0: node, 1: apidoc-almond).
      argv:     process.argv.slice(2),
    },
    // args
    (options || {})
  );

  // Do this _after_ setting this.argv;
  this.opts = this.parseArgs();
  if( this.opts.output && !this.dir ){
    this.dir = this.opts.output;
  }
}

extend(Nut.prototype, {
  parseArgs: function () {
    // TODO
  },

  path: function (file) {
    return path.join(this.dir, file);
  },

  _command: function (cmd, args, cb) {
    var proc = child_process.spawn(
      cmd,
      args,
      {
        stdio: 'inherit',
      }
    );
    proc.on('close', function(code) {
      if( code !== 0 ){
        console.error('Command ' + cmd + ' exited with ' + code);
      }
      if( cb ){ cb(); }
    });
  },

  run: function () {
    this.apidoc(function() {
      if( this.opts.help ){
        // apidoc will have printed usage first, now we can do ours.
        this.usage();
      }
      else {
        this.rjs(
          this.cb // no binding
        );
      }
    }.bind(this));
  },
});

Nut.main = function (opts) {
  (new Nut(opts)).run();
};

module.exports = Nut;
