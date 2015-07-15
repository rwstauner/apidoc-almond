/*jslint node: true */

var fs = require('fs'),
    path = require('path'),
    minimist = require('minimist'),
    requirejs = require('requirejs'),
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
    // Option specs from apidoc (apidoc uses nomnom):
    //.option('output', { abbr: 'o', 'default': './doc/', help: 'Output dirname.' })

    // nomnom does too much processing on the args.
    // minimist does less so we can query a few options and let the rest pass through.
    return minimist(this.argv, {
      // TODO: silent
      boolean: ['apidoc', 'help'],
      alias: {
        o: 'output',
        h: 'help'
      },
      'default': {
        apidoc: true,
        // Same as apidoc.
        output: './doc/'
      },
      string: 'output',
    });
  },

  usage: function () {
    console.log([
      "# apidoc-almond usage",
      "",
      "All arguments are passed to apidoc unless --no-apidoc is specified.",
      "This allows the script to work as a wrapper (default) or simply a post-processor.",
      "apidoc-almond does use the following arguments if present:",
      "  --output",
    ].join("\n"));
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

  _rjs: function (opts, cb) {
    console.info("optimizing...");

    requirejs.optimize(opts, function (buildResponse) {
      // Differentiate optimization output with an indent.
      console.log(buildResponse.replace(/^/mg, "  "));

      if( cb ){ cb(); }
    }, function(err) {
      console.warn("RequireJS optimization failed: " + err);
    });
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
        }, function (){
          // The optimized file isn't useful if we don't modify the index to use it.
          this.modifyIndex(cb);
        }.bind(this));
      }
    }.bind(this));
  },

  modifyFile: function (file, contentcb, donecb){
    var fileopts = { encoding: 'utf8' };

    fs.readFile(file, fileopts, function (err, data) {
      if (err) { throw err; }

      var content = contentcb(data);

      fs.writeFile(file, content, fileopts, function(err){
        if (err) { throw err; }

        if (donecb) { donecb(); }
      });
    });
  },

  // Replace require.js loader with optimized build.
  modifyIndex: function (cb) {
    this.modifyFile(this.path('index.html'), function (content) {
      return content.replace(
        /<script data-main="main.js" src="vendor\/require.min.js">/,
        '<script src="' + this.optmain + '">'
      );
    }.bind(this), cb);
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
