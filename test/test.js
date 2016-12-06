'use strict';

var fs = require('fs');
var path = require('path');
var NPMResolver = require('../lib/NPMResolver');
var kevoree = require('kevoree-library');
var factory = new kevoree.factory.DefaultKevoreeFactory();

describe('NPMResolver', function () {
  this.timeout(20000);

  var modulesPath = path.resolve(process.cwd(), '.deployUnits');
	if (!fs.existsSync(modulesPath)) { fs.mkdirSync(modulesPath); }
  // do not polute my shell please :)
  var noop = function () {};
  var logger = {
    info: noop,
    debug: noop,
    warn: noop,
    error: noop
  };
  var resolver = new NPMResolver(modulesPath, logger, true);

  it('should install kevoree-node-javascript:5.2.0', function (done) {
    var du = factory.createDeployUnit();
    du.name = 'kevoree-node-javascript';
    du.version = '5.2.0';
    resolver.resolve(du, function (err) {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });

  it('should fail to install something-that-does-not-exist:1.2.3', function (done) {
    console.log('An error should be printed...');
    var du = factory.createDeployUnit();
    du.name = 'something-that-does-not-exist';
    du.version = '1.2.3';
    resolver.resolve(du, function (err) {
      if (err) {
        done();
      } else {
        done(new Error('Should fail!'));
      }
    });
  });

  it('should fail to install kevoree-node-javascript:145215.1.2 (unknown version)', function (done) {
    console.log('An error should be printed...');
    var du = factory.createDeployUnit();
    du.name = 'kevoree-node-javascript';
    du.version = '145215.1.2';
    resolver.resolve(du, function (err) {
      if (err) {
        done();
      } else {
        done(new Error('This test should fail but it passes!!'));
      }
    });
  });
});
