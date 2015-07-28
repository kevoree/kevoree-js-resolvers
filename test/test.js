var fs = require('fs');
var path = require('path');
var assert = require('assert');
var rimraf = require('rimraf');
var NPMResolver = require('../lib/NPMResolver');
var kevoree = require('kevoree-library').org.kevoree;
var factory = new kevoree.factory.DefaultKevoreeFactory();

describe('NPMResolver', function () {
    this.timeout(20000);

    var parent = path.resolve(process.cwd(), '.deployUnits'),
        latest = path.resolve(parent, 'latest'),
        release = path.resolve(parent, 'release'),
        version = path.resolve(parent, '^4');

    it('should install kevoree-node-javascript:latest', function (done) {
        var resolver = new NPMResolver(latest);
        var du = factory.createDeployUnit();
        du.name = 'kevoree-node-javascript';
        du.version = 'latest';
        resolver.resolve(du, function (err) {
            done(err);
            // todo improve that and check that it actually installed the latest (snapshot included)
        });
    });

    it('should install kevoree-node-javascript:release', function (done) {
        var resolver = new NPMResolver(release);
        var du = factory.createDeployUnit();
        du.name = 'kevoree-node-javascript';
        du.version = 'release';
        resolver.resolve(du, function (err) {
            done(err);
            // todo improve that and check that it actually installed the latest release (snapshot excluded)
        });
    });

    it('should install kevoree-node-javascript:^4', function (done) {
        var resolver = new NPMResolver(version);
        var du = factory.createDeployUnit();
        du.name = 'kevoree-node-javascript';
        du.version = '^4';
        resolver.resolve(du, function (err) {
            done(err);
            // todo improve that and check that it actually installed the latest release (snapshot excluded)
        });
    });

    it('should uninstall kevoree-node-javascript:^4', function (done) {
        var resolver = new NPMResolver(version);
        var du = factory.createDeployUnit();
        du.name = 'kevoree-node-javascript';
        du.version = '^4';
        resolver.uninstall(du, function (err) {
            if (err) {
                done(err);
            } else {
                fs.exists(path.resolve(version, 'node_modules', du.name), function (exists) {
                    assert.strictEqual(exists, false, 'kevoree-node-javascript:^4 deployUnit should be deleted');
                    done();
                });
            }
        });
    });

    after(function (done) {
        // clean
        rimraf(parent, done);
    });
});
