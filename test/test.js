var fs = require('fs');
var path = require('path');
var assert = require('assert');
var rimraf = require('rimraf');
var NPMResolver = require('../lib/NPMResolver');
var kevoree = require('kevoree-library').org.kevoree;
var factory = new kevoree.factory.DefaultKevoreeFactory();

describe('NPMResolver', function () {
    this.timeout(20000);

    var modulesPath = path.resolve(process.cwd(), '.deployUnits');
    var resolver = new NPMResolver(modulesPath);
    // do not polute my shell please :)
    resolver.log.info = resolver.log.debug = resolver.log.warn = resolver.log.error = function () { /* noop */ };

    it('should install kevoree-node-javascript:latest', function (done) {
        var du = factory.createDeployUnit();
        du.name = 'kevoree-node-javascript';
        du.version = 'latest';
        resolver.resolve(du, function (err, JavascriptNode) {
            if (err) {
                done(err);
            } else {
                var node = new JavascriptNode();
                done();
            }
        });
    });

    it('should install kevoree-node-javascript:5.2.0', function (done) {
        var du = factory.createDeployUnit();
        du.name = 'kevoree-node-javascript';
        du.version = '5.2.0';
        resolver.resolve(du, function (err, JavascriptNode) {
          if (err) {
              done(err);
          } else {
              var node = new JavascriptNode();
              done();
          }
        });
    });

    it('should install kevoree-node-javascript:^4', function (done) {
        var du = factory.createDeployUnit();
        du.name = 'kevoree-node-javascript';
        du.version = '^4';
        resolver.resolve(du, function (err, JavascriptNode) {
          if (err) {
              done(err);
          } else {
              var node = new JavascriptNode();
              done();
          }
        });
    });

    it('should fail to install something-that-does-not-exist:yolo', function (done) {
        var du = factory.createDeployUnit();
        du.name = 'something-that-does-not-exist';
        du.version = 'yolo';
        resolver.resolve(du, function (err, Clazz) {
            if (err) {
                done();
            } else {
                done(new Error('Should fail!'));
            }
        });
    });

    it('should fail to install kevoree-node-javascript:145215.1.2 (unknown version)', function (done) {
        var du = factory.createDeployUnit();
        du.name = 'kevoree-node-javascript';
        du.version = '145215.1.2';
        resolver.resolve(du, function (err, Clazz) {
            if (err) {
                done();
            } else {
                done(new Error('Should fail!'));
            }
        });
    });
});
