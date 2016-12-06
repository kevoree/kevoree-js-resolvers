'use strict';

var path = require('path');
var fs = require('fs');
var pkgHash = require('pkg-hash');
var npa = require('npm-package-arg');
var Q = require('q');
var crypto = require('crypto');

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
    var pkgJsonPath = [prefix, 'node_modules']
      .concat(parsed.name.split('/')) // just in case module name is scoped
      .concat(['package.json']);
    pkgJsonPath = path.resolve.apply(null, pkgJsonPath);
    fs.readFile(pkgJsonPath, 'utf8', function (err, data) {
      if (err) {
        if (err.code === 'ENOENT') {
          callback(null, false);
        } else {
          callback(err);
        }
      } else {
        var error, result, hashValues;
        Q.nfcall(pkgHash, path.join(pkgJsonPath, '..'))
        .then(function (hash) {
					var pkg = JSON.parse(data);
          if (!skipIntegrityCheck) {
            hash = crypto
              .createHash('md5')
              .update(hash + pkg.kevoree.namespace + '/' + pkg.name + '/' + pkg.version + JSON.stringify(pkg.dependencies))
              .digest('hex');

            if (hash === hashcode) {
              result = true;
            } else {
              result = true;
              hashValues = { local: hash, model: hashcode };
            }
          } else {
						if (pkg.version === parsed.spec) {
							result = true;
						} else {
							result = false;
						}
          }
        })
        .catch(function (err) {
          error = err;
        })
        .finally(function () {
          callback(error, result, hashValues);
        });
      }
    });
  }
}

module.exports = exists;
