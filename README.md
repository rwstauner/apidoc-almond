# apidoc-almond

This a dumb hack to optimize [apidoc][apidoc] output with [almond.js][almond].

All arguments are passed to apidoc unless `--no-apidoc` is specified.
This allows the script to work as a wrapper (default) or simply a post-processor.


# Install

    npm install -g apidoc-almond


# Use

    apidoc-almond -i app/ -o docs/

Or, if you want to run apidoc separately first...

    apidoc-almond -o docs/ --no-apidoc


[almond]: https://github.com/jrburke/almond
[apidoc]: https://github.com/apidoc/apidoc
