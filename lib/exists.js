'use strict';

var path = require('path'),
  fs = require('fs'),
  pkgHash = require('pkg-hash');

/**
 *
 * @param module
 * @param prefix
 * @param hashcode
 * @param callback
 */
function exists(module, prefix, hashcode, callback) {
  if (module.indexOf(path.sep) === -1) {
    fs.readFile(path.resolve(prefix, 'node_modules', module.split('@')[0], 'package.json'), 'utf8', function (err, data) {
      if (err) {
        if (err.code === 'ENOENT') {
          callback(null, false);
        } else {
          callback(err);
        }
      } else {
        var error, result, hashValues;
        try {
          var pkg = JSON.parse(data);
          var hash = pkgHash(
            pkg.kevoree.namespace + '/' + pkg.name + '/' + pkg.version,
            pkg.dependencies
          );
          if (hash === hashcode) {
            result = true;
          } else {
            result = false;
            hashValues = { local: hash, model: hashcode };
          }
        } catch (err) {
          error = err;
          result = false;
        }
        callback(error, result, hashValues);
      }
    });
  } else {
    // module name is a path => local install
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
  }
}

module.exports = exists;
