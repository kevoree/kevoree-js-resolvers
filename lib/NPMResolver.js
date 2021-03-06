'use strict';

var Resolver = require('kevoree-commons').Resolver;
var fs = require('fs');
var path = require('path');
var util = require('util');
var mkdirp = require('mkdirp');
var exec = require('./exec');
var exists = require('./exists');

var DEFAULT_PKGJSON = JSON.stringify({
	name: 'kevoree-local-deployunits',
	version: '0.0.0',
	description: 'This file has been generated by Kevoree in order to prevent npm from outputing log warnings.',
	private: true
}, null, 2);

function NPMResolver(modulesPath, logger, skipIntegrityCheck) {
	Resolver.call(this, modulesPath, logger);
	this.log.debug(this.toString(), 'DeployUnits install directory: ' + this.modulesPath);
	fs.writeFileSync(path.resolve(this.modulesPath, 'package.json'), DEFAULT_PKGJSON, 'utf8');
	this.skipIntegrityCheck = Boolean(skipIntegrityCheck);
}

util.inherits(NPMResolver, Resolver);

NPMResolver.prototype.resolve = function(deployUnit, forceInstall, callback) {
	if (!callback) {
		// "forceInstall" parameter is not specified (optional)
		callback = forceInstall;
	}

	var pkgPath = path.resolve(this.modulesPath, 'node_modules', deployUnit.name),
		options = {
			name: deployUnit.name + '@' + deployUnit.version,
			path: this.modulesPath,
			hashcode: deployUnit.hashcode
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
};

NPMResolver.prototype.uninstall = function(deployUnit, callback) {
	exec('npm', [
		'uninstall', deployUnit.name
	], {
		cwd: this.modulesPath,
		stdio: ['ignore', 'ignore', process.stderr]
	}, function(err) {
		if (err) {
			callback(new Error('NPMResolver failed to uninstall ' + deployUnit.name));
		} else {
			callback();
		}
	});
};

NPMResolver.prototype.npmLoad = function(pkgPath, options, callback) {
	var start = new Date().getTime();
	exists(options.name, options.path, options.hashcode, this.skipIntegrityCheck, function(err, doesExist, hashError) {
		if (err) {
			callback(err);
		} else {
			if (doesExist && hashError) {
				this.log.debug(this.toString(), options.name + ' local hashcode differs from model');
				this.log.debug(this.toString(), 'local=' + hashError.local + ' model=' + hashError.model);
			}

			if (doesExist && !hashError) {
				this.log.debug(this.toString(), options.name + ' found in ' + options.path + ' (' + (new Date().getTime() - start) + 'ms)');
				this.loadClass(pkgPath, callback);
				return;
			}

			this.log.debug(this.toString(), options.name + ' installing...');
			exec('npm', [
				'install', options.name, '--production'
			], {
				cwd: options.path,
				stdio: ['ignore', 'ignore', process.stderr]
			}, function(err) {
				if (err) {
					this.log.error(this.toString(), options.name + ' installation failed');
					callback(new Error('Unable to install DeployUnit ' + options.name));
				} else {
					this.log.info(this.toString(), options.name + ' installed (' + (new Date().getTime() - start) + 'ms)');
					exists(options.name, options.path, options.hashcode, this.skipIntegrityCheck, function(err, doesExist, hashError) {
						if (err) {
							callback(err);
						} else {
							if (doesExist && !hashError) {
								this.loadClass(pkgPath, callback);
							} else {
								this.log.error(this.toString(), 'installed ' + options.name + ' differs from registry (hash)');
								callback(new Error('Deployunit ' + options.name + ' integrity check failed'));
							}
						}
					}.bind(this));
				}
			}.bind(this));
		}
	}.bind(this));
};

NPMResolver.prototype.loadClass = function(pkgPath, callback) {
	// resolve deployUnit module (require it) and call callback
	delete require.cache[pkgPath];
	var error,
		Class;
	try {
		Class = require(pkgPath);
	} catch (err) {
		error = err;
		this.log.error(this.toString(), 'Unable to require(\'' + pkgPath + '\')');
	}
	callback(error, Class);
};

NPMResolver.prototype.toString = function() {
	return 'NPMResolver';
};

module.exports = NPMResolver;
