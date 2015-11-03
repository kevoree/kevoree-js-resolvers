var Resolver = require('kevoree-commons').Resolver,
    kevoree  = require('kevoree-library').org.kevoree,
    fs       = require('fs'),
    path     = require('path'),
    rimraf   = require('rimraf'),
    mkdirp   = require('mkdirp'),
    npmVers  = require('npm-vers'),
    execNpm  = require('exec-npm'),
    exists   = require('./exists');

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

        var pkgPath = path.resolve(this.modulesPath, 'node_modules', deployUnit.name),
            options = {
                name: deployUnit.name + '@' + deployUnit.version,
                path: this.modulesPath
            };

        mkdirp(this.modulesPath, function (err) {
            if (err) {
                callback(err);
            } else {
                this.npmLoad(pkgPath, options, callback);
            }
        }.bind(this));
    },

    uninstall: function (deployUnit, callback) {
        execNpm([ 'uninstall', deployUnit.name, '--prefix=' + this.modulesPath ], function (err) {
            if (err) {
                callback(new Error('NPMResolver failed to uninstall '+deployUnit.name));
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
                    this.loadClass(pkgPath, callback);
                } else {
                    execNpm([ 'install', options.name, '--prefix=' + options.path ], function (err) {
                        if (err) {
                            this.log.error(this.toString(), err.message);
                            callback(new Error("Resolve failed for DeployUnit "+options.name));
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
