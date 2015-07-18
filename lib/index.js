/*jslint node: true */

var pfs = require('./pfs'),
    path = require('path'),
    minimist = require('minimist'),
    requirejs = require('requirejs'),
    Promise = require('promise'),
    sprintf = require('util').format,
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

function indent (str) {
  return str.replace(/^/mg, '  ');
}

function Nut (options) {
  extend(this,
    // defaults
    {
      almond:   almondpath,
      optmain:  'main.opt.js',
      // Strip exec args (0: node, 1: js (apidoc-almond)).
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

  if( this.opts.silent ){
    this.silent = true;
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
      boolean: ['apidoc', 'help', 'silent'],
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
    this.print("# apidoc-almond usage\n\n" + indent([
      "All arguments are passed to apidoc unless --no-apidoc is specified.",
      "This allows the script to work as a wrapper (default) or simply a post-processor.",
      "apidoc-almond does use the following arguments if present:",
      "  --output, --silent",
    ].join("\n")));
  },

  print: console.log,
  verbose: function(msg) {
    if (!this.silent) {
      this.print(msg);
    }
  },

  path: function (file) {
    return path.join(this.dir, file);
  },

  _command: function (cmd, args) {
    var print = this.print;
    return new Promise(function (resolve) {
      // Start at deps, and keep going up.  This will find a dependency,
      // peerDependency, even a global if $NODE_PATH is setup (in that order).
      resolve(require.resolve(cmd));
    })
    .catch(function (err) {
      // If there was some other error, propagate.
      if( err.code !== 'MODULE_NOT_FOUND' ){ throw err; }
      // If no module is found, just return the base (assume it's in $PATH).
      return path.basename(cmd);
    })
    .then(function (cmd) {
      return new Promise(function (resolve) {
        var stdout = [];
        var child = child_process.spawn(cmd, args, {
          stdio: [process.stdin, 'pipe', process.stderr],
        });
        // Buffer stdout.
        child.stdout.on('data', function (data) {
          stdout.push(data.toString());
        });
        // Wait for process to finish.
        child
        .on('error', function (err) {
          // Provide slightly more helpful error message.
          if( err.code === 'ENOENT' ){
            var parts = cmd.split('/');
            throw new Error(sprintf('Command "%s" not found.  Is "%s" installed?',
              // The command is the tail, the module that includes it is the head.
              parts[parts.length - 1], parts[0]
            ));
          }
          // Rethrow.
          throw err;
        })
        .on('close', function (code) {
          // Drain buffer (differentiate with indent).
          if( stdout.length ){
            print(indent(stdout.join('')));
          }
          if( code !== 0 ){
            console.error(sprintf('Command "%s" exited with %s', cmd, code));
          }
          // Resolve anyway; not really sure what the command did, so try to continue.
          resolve();
        });
      });
    });
  },

  _apidoc: function (args) {
    return this._command('apidoc/bin/apidoc', args);
  },
  apidoc: function () {
    if( this.opts.apidoc ){
      if( this.opts.help ){
        this.print("# apidoc usage");
      }
      else {
        this.verbose("apidoc...");
      }

      // If the apidoc arg was present we'd need to filter it out, but if the arg is
      // present as the negative then we aren't calling this.
      return this._apidoc(this.argv);
    }

    // If not calling apidoc, continue with tasks.
    return Promise.resolve();
  },

  _rjs: function (opts) {
    this.verbose("optimizing...");

    return new Promise(function (resolve, reject) {
      requirejs.optimize(opts, function (buildResponse) {
        // Differentiate optimization output with an indent.
        this.verbose(indent(buildResponse));
        resolve();
      }.bind(this), function(err) {
        console.warn("RequireJS optimization failed: " + err);
        reject(err);
      });
    }.bind(this));
  },

  // Use almond to embed deps and optimize file size.
  rjs: function () {
    var main = path.resolve(this.path('main.js'));

    // Check that apidoc ran.
    return pfs.stat(main)
      .then(function () {
        // apidoc < 0.8.0 used an old Handlebars that required munging for use with almond (it used `var`):
        // apidoc >= 0.8.0 upgraded to Handlebars 2+ which now works without munging.
        //perl -p -i -e 's/^(\s+handlebars: \{)/$1\ninit: function() { return Handlebars; },/' $dir/main.js

        return this._rjs({
          baseUrl:        this.dir,
          name:           path.relative(this.dir, this.almond),
          include:        ['main'],
          insertRequire:  ['main'],
          mainConfigFile: main,
          out:            this.path(this.optmain),
          wrap:           true,
        }).then(function () {
          // The optimized file isn't useful if we don't modify the index to use it.
          return this.modifyIndex();
        }.bind(this));
      }.bind(this))
      .catch(function (err) {
        // We use stat to abort if the file doesn't exist, so simplify the message.
        if( err.code === 'ENOENT' && err.path === main ){
          throw new Error(sprintf('Cannot optimize; not found: "%s"', main));
        }
        throw err;
      });
  },

  modifyFile: function (file, contentcb) {
    var fileopts = { encoding: 'utf8' };
    return pfs.readFile(file, fileopts)
      .then(function (content) {
        return contentcb(content);
      })
      .then(function (content) {
        return pfs.writeFile(file, content, fileopts);
      });
  },

  // Replace require.js loader with optimized build.
  modifyIndex: function () {
    return this.modifyFile(this.path('index.html'), function (content) {
      return content.replace(
        /<script data-main="main.js" src="vendor\/require.min.js">/,
        sprintf('<script src="%s">', this.optmain)
      );
    }.bind(this));
  },

  run: function () {
    return this.apidoc().then(function() {
      if( this.opts.help ){
        // apidoc will have printed usage first, now we can do ours.
        return this.usage();
      }
      return this.rjs();
    }.bind(this));
  },
});

Nut.main = function (opts) {
  return (new Nut(opts)).run();
};

module.exports = Nut;
