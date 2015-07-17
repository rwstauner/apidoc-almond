# apidoc-almond

[![Build Status](https://travis-ci.org/rwstauner/apidoc-almond.svg?branch=master)](https://travis-ci.org/rwstauner/apidoc-almond)
[![Coverage Status](https://coveralls.io/repos/rwstauner/apidoc-almond/badge.svg?branch=master&service=github)](https://coveralls.io/github/rwstauner/apidoc-almond?branch=master)

This a dumb hack to optimize [apidoc][apidoc] output with [almond.js][almond].

All arguments are passed to apidoc unless `--no-apidoc` is specified.
This allows the script to work as a wrapper (default) or simply a post-processor.


# Installation

Install the same way you install `apidoc`:

    npm install -g apidoc-almond

or add them both to your package.json and:

    npm install


# Usage

    apidoc-almond -i app/ -o docs/

Or, if you want to run apidoc separately first...

    apidoc -o docs/ ...
    apidoc-almond -o docs/ --no-apidoc


[almond]: https://github.com/jrburke/almond
[apidoc]: https://github.com/apidoc/apidoc
