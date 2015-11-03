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
        resolver.resolve(du, function (err) {
            done(err);
            // todo improve that and check that it actually installed the latest release (snapshot excluded)
        });
    });

    it('should install kevoree-node-javascript:^4', function (done) {
        var du = factory.createDeployUnit();
        du.name = 'kevoree-node-javascript';
        du.version = '^4';
        resolver.resolve(du, function (err) {
            done(err);
            // todo improve that and check that it actually installed the latest release (snapshot excluded)
        });
    });

    it('should uninstall kevoree-node-javascript:^4', function (done) {
        var du = factory.createDeployUnit();
        du.name = 'kevoree-node-javascript';
        du.version = '^4';
        resolver.uninstall(du, function (err) {
            if (err) {
                done(err);
            } else {
                fs.exists(path.resolve(modulesPath, 'node_modules', du.name), function (exists) {
                    assert.strictEqual(exists, false, 'kevoree-node-javascript:^4 deployUnit should be deleted');
                    done();
                });
            }
        });
    });

    after(function (done) {
        // clean
        rimraf(modulesPath, done);
    });
});
