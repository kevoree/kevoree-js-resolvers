var path = require('path'),
	fs = require('fs'),
	latestVersion = require('latest-version');

/**
 *
 * @param module
 * @param prefix
 * @param callback
 */
function exists(module, prefix, callback) {
	if (module.indexOf(path.sep) === -1) {
		fs.readFile(path.resolve(prefix, 'node_modules', module.split('@')[0], 'package.json'), 'utf8', function(err, data) {
			if (err) {
				if (err.code === 'ENOENT') {
					callback(null, false);
				} else {
					callback(err);
				}
			} else {
        try {
          var pkg = JSON.parse(data);

          var m = module.split('@');
          if (m.length === 2) {
            if (m[1] === 'latest') {
              isLatest(m[0], pkg, callback);
            } else {
              if (pkg.version === m[1]) {
                callback(null, true);
              } else {
                callback(null, false);
              }
            }
          } else {
            isLatest(module, pkg, callback);
          }
        } catch (error) {
          callback(error, false);
        }
			}
		});
	} else {
		// module name is a path => local install
		fs.readFile(path.resolve(module, 'package.json'), 'utf8', function(err, data) {
			if (err) {
				if (err.code === 'ENOENT') {
					callback(null, false);
				} else {
					callback(err);
				}
			} else {
				var localPkg = JSON.parse(data);
				fs.readFile(path.resolve(prefix, 'node_modules', localPkg.name, 'package.json'), 'utf8', function(err, data) {
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
	}
}

function isLatest(module, pkg, callback) {
	latestVersion(module).then(function(version) {
    callback(null, pkg.version === version);
	}, callback);
}

module.exports = exists;
