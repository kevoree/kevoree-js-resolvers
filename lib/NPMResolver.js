var Resolver = require('kevoree-commons').Resolver,
  kevoree = require('kevoree-library').org.kevoree,
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  execNpm = require('exec-npm'),
  exists = require('./exists');

var NPMResolver = Resolver.extend({
  toString: 'NPMResolver',

  construct: function () {
    this.log.debug(this.toString(), 'modulesPath= ' + this.modulesPath);
  },

  resolve: function (deployUnit, forceInstall, callback) {
    if (!callback) {
      // "forceInstall" parameter is not specified (optional)
      callback = forceInstall;
    }

    var pkgPath = path.resolve(this.modulesPath, 'node_modules', deployUnit.name),
      options = {
        name: deployUnit.name + '@' + deployUnit.version,
        path: this.modulesPath
      };

    mkdirp(this.modulesPath, function (err) {
      if (err) {
        callback(err);
      } else {
        // lets try to check if the current directory contains the library
        // so that we can install it with the local content
        fs.readFile(path.resolve('.', 'package.json'), function (err, data) {
          if (err) {
            // unable to require current directory package.json, lets try to resolve module from npm registry
            this.npmLoad(pkgPath, options, callback);
          } else {
            var pkg = JSON.parse(data);
            if (pkg.name === deployUnit.name) {
              // current directory contains the library we want to resolve
              options.name = path.resolve('.');
              this.npmLoad(pkgPath, options, callback);
            } else {
              // unable to find module locally, lets try to resolve it from npm registry
              this.npmLoad(pkgPath, options, callback);
            }
          }
        }.bind(this));
      }
    }.bind(this));
  },

  uninstall: function (deployUnit, callback) {
    execNpm(['uninstall', deployUnit.name, '--prefix=' + this.modulesPath], {
      stdio: 'ignore'
    }, function (err) {
      if (err) {
        callback(new Error('NPMResolver failed to uninstall ' + deployUnit.name));
      } else {
        callback();
      }
    });
  },

  npmLoad: function (pkgPath, options, callback) {
    exists(options.name, options.path, function (err, exists) {
      if (err) {
        callback(err);
      } else {
        if (exists) {
          // do not re-install an already installed module
          this.log.debug(this.toString(), options.name + ' found in ' + path.relative(process.cwd(), options.path));
          this.loadClass(pkgPath, callback);
        } else {
          this.log.debug(this.toString(), 'Installing ' + options.name + ' ...');
          execNpm(['install', options.name, '--prefix=' + options.path], {
            stdio: 'ignore'
          }, function (err) {
            if (err) {
              this.log.error(this.toString(), err.message);
              callback(new Error("Resolve failed for DeployUnit " + options.name));
              return;
            }

            this.loadClass(pkgPath, callback);
          }.bind(this));
        }
      }
    }.bind(this));
  },

  loadClass: function (pkgPath, callback) {
    // resolve deployUnit module (require it) and call callback
    delete require.cache[pkgPath];
    var KClass = require(pkgPath);
    callback(null, KClass);
  }
});

module.exports = NPMResolver;
