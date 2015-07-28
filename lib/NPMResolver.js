var Resolver = require('kevoree-commons').Resolver,
    kevoree  = require('kevoree-library').org.kevoree,
    fs       = require('fs'),
    path     = require('path'),
    rimraf   = require('rimraf'),
    npmVers  = require('npm-vers'),
    execNpmInstall = require('exec-npm-install');

var NPMResolver = Resolver.extend({
    toString: 'NPMResolver',

    construct: function () {
        this.log.debug(this.toString(), 'modulesPath= '+this.modulesPath);
    },

    resolve: function (deployUnit, forceInstall, callback) {
        if (!callback) {
            // "forceInstall" parameter is not specified (optional)
            callback = forceInstall;
        }

        var npmiLoad = function () {
            execNpmInstall(options, function (err) {
                if (err) {
                    this.log.error(this.toString(), err.message);
                    callback(new Error("Resolve failed"));
                    return;
                }

                // resolve deployUnit module (require it) and call callback
                var KClass = require(pkgPath);
                var jsonModel = require(path.resolve(pkgPath, 'kevlib.json'));
                try {
                    var model = loader.loadModelFromString(JSON.stringify(jsonModel)).get(0);
                    callback(null, KClass, model);
                } catch (err) {
                    // something went wrong while loading model :/
                    callback(err);
                }
            }.bind(this));
        }.bind(this);

        var factory = new kevoree.factory.DefaultKevoreeFactory(),
            loader  = factory.createJSONLoader(),
            pkgPath = path.resolve(this.modulesPath, 'node_modules', deployUnit.name), // default npm module location
            options = {
                modules: [ deployUnit.name + '@' + deployUnit.version ],
                prefix:  this.modulesPath
            };

        if (deployUnit.version === 'release') {
            npmVers(deployUnit.name, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    if (result.latestRelease) {
                        options.modules = [ deployUnit.name + '@' + result.latestRelease ];
                        npmiLoad();
                    } else {
                        callback(new Error('No release version found for ' + deployUnit.name));
                    }
                }
            }.bind(this));
        } else {
            // lets try to check if the current directory contains the library
            // so that we can install it with the local content
            fs.readFile(path.resolve('.', 'package.json'), function (err, data) {
                if (err) {
                    // unable to require current directory package.json, lets try to resolve module from npm registry
                    npmiLoad();
                    return;
                }

                var pkg = JSON.parse(data);
                if (pkg.name === deployUnit.name) {
                    // current directory contains the library we want to resolve
                    options.modules = [ path.resolve('.') ];
                    npmiLoad();
                } else {
                    // unable to find module locally, lets try to resolve it from npm registry
                    npmiLoad();
                }
            }.bind(this));
        }
    },

    uninstall: function (deployUnit, callback) {
        // TODO clean require.cache ?
        rimraf(path.resolve(this.modulesPath, 'node_modules', deployUnit.name), function (err) {
            if (err) {
                callback(new Error('NPMResolver failed to uninstall '+deployUnit.name));
            } else {
                callback();
            }
        });
    }
});

module.exports = NPMResolver;
