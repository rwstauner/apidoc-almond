/*jslint node: true */

var fs = require('fs'),
    path = require('path'),
    child_process = require('child_process');

var almondpath = require.resolve('almond').replace(/\.js$/,'');

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
      almond:   almondpath,
      optmain:  'main.opt.js',
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

  // Strip trailing slash.
  this.dir = this.dir.replace(/\/$/, '');
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

  _apidoc: function (args, cb) {
    // This assumes apidoc is in $PATH.
    this._command('apidoc', args, cb);
  },
  apidoc: function (cb) {
    if( this.opts.apidoc ){
      if( this.opts.help ){
        console.log("# apidoc usage");
      }
      else {
        console.info("apidoc...");
      }
      // If the apidoc arg was present we'd need to filter it out, but if the arg is
      // present as the negative then we aren't calling this.
      this._apidoc(this.argv, cb);
    }
    else {
      if (cb) { cb(); }
    }
  },

  kvArray: function (obj) {
    var k, arr = [];
    for(k in obj){
      if( obj.hasOwnProperty(k) ){
        arr.push(k + '=' + (obj[k] instanceof Array ? obj[k].join(',') : obj[k]).toString());
      }
    }
    return arr;
  },

  _rjs: function (opts, cb) {
    console.info("optimizing...");
    this._command('r.js', [ '-o' ].concat(this.kvArray(opts)), cb);
  },

  // Use almond to embed deps and optimize file size.
  rjs: function (cb) {
    var main = path.resolve(this.path('main.js'));

    // Check that apidoc ran.
    fs.stat(main, function(err){
      if (err) {
        // Simplify the error if the file simply isn't there.
        if( err.code === 'ENOENT' ){
          console.error('Failed to open file "' + main + '"');
        }
        else {
          throw err;
        }
      }
      else {
        this._rjs({
          baseUrl:        this.dir,
          name:           path.relative(this.dir, this.almond),
          include:        ['main'],
          insertRequire:  ['main'],
          mainConfigFile: main,
          out:            this.path(this.optmain),
          wrap:           true,
        }, cb);
      }
    }.bind(this));
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
