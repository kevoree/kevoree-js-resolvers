var Resolver = require('kevoree-commons').Resolver,
	fs = require('fs'),
	path = require('path'),
	mkdirp = require('mkdirp'),
	ied = require('ied'),
	exists = require('./exists');

var NPMResolver = Resolver.extend({
	toString: 'NPMResolver',

	construct: function() {
		this.log.debug(this.toString(), 'modulesPath= ' + this.modulesPath);
	},

	resolve: function(deployUnit, forceInstall, callback) {
		if (!callback) {
			// "forceInstall" parameter is not specified (optional)
			callback = forceInstall;
		}

		var pkgPath = path.resolve(this.modulesPath, 'node_modules', deployUnit.name),
			options = {
				name: deployUnit.name + '@' + deployUnit.version,
				path: this.modulesPath
			};

		mkdirp(this.modulesPath, function(err) {
			if (err) {
				callback(err);
			} else {
				// lets try to check if the current directory contains the library
				// so that we can install it with the local content
				fs.readFile(path.resolve('.', 'package.json'), function(err, data) {
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

	uninstall: function(deployUnit, callback) {
		this.log.warn(this.toString(), 'Uninstall process no longer available. Installed module ' + deployUnit.name + '@' + deployUnit.version + ' will not be deleted from ' + this.modulesPath);
		callback();
	},

	npmLoad: function(pkgPath, options, callback) {
		exists(options.name, options.path, function(err, exists) {
			if (err) {
				callback(err);
			} else {
				if (exists) {
					// do not re-install an already installed module
					this.loadClass(pkgPath, callback);
				} else {
					ied.installCmd(options.path, {
						_: [null, options.name]
					}, function(err) {
						if (err) {
              this.log.error(this.toString(), err.message);
              callback(new Error("Resolve failed for DeployUnit " + options.name));
						} else {
							this.loadClass(pkgPath, callback);
						}
					}.bind(this));
				}
			}
		}.bind(this));
	},

	loadClass: function(pkgPath, callback) {
		// resolve deployUnit module (require it) and call callback
		delete require.cache[pkgPath];
		var KClass = require(pkgPath);
		callback(null, KClass);
	}
});

module.exports = NPMResolver;
