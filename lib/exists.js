'use strict';

var path = require('path');
var fs = require('fs');
var kHash = require('kevoree-hash');
var npa = require('npm-package-arg');

/**
 *
 * @param module
 * @param prefix
 * @param hashcode
 * @param skipIntegrityCheck
 * @param callback
 */
function exists(module, prefix, hashcode, skipIntegrityCheck, callback) {
	var parsed = npa(module);
	if (parsed.type === 'local') {
		// module name is a path
		fs.readFile(path.resolve(module, 'package.json'), 'utf8', function (err, data) {
			if (err) {
				if (err.code === 'ENOENT') {
					callback(null, false);
				} else {
					callback(err);
				}
			} else {
				var localPkg = JSON.parse(data);
				fs.readFile(path.resolve(prefix, 'node_modules', localPkg.name, 'package.json'), 'utf8', function (err, data) {
					if (err) {
						if (err.code === 'ENOENT') {
							callback(null, false);
						} else {
							callback(err);
						}
					} else {
						var installedPkg = JSON.parse(data);
						callback(null, localPkg.version === installedPkg.version);
					}
				});
			}
		});
	} else {
		// module name looks "normal"
		var pkgJsonPath = [prefix, 'node_modules'].concat(parsed.name.split('/')). // just in case module name is scoped
		concat(['package.json']);
		// using resolve.apply() because pkgJsonPath is an array here
		pkgJsonPath = path.resolve.apply(null, pkgJsonPath);
		fs.readFile(pkgJsonPath, 'utf8', function (err, data) {
			if (err) {
				if (err.code === 'ENOENT') {
					callback(null, false);
				} else {
					callback(err);
				}
			} else {
				var error;
				var result;
				var hashValues;
				try {
					var hash = kHash(path.join(pkgJsonPath, '..'));
					var pkg = JSON.parse(data);
					if (!skipIntegrityCheck) {
						if (hash === hashcode) {
							result = true;
						} else {
							result = true;
							hashValues = {
								local: hash,
								model: hashcode
							};
						}
					} else {
						if (pkg.version === parsed.spec) {
							result = true;
						} else {
							result = false;
						}
					}
				} catch (err) {
					error = err;
				}

				callback(error, result, hashValues);
			}
		});
	}
}

module.exports = exists;
