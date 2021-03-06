'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');

require('loadenv')('monitor-dog');
var monitor = require('../../index.js');

describe('Monitor', function() {
  describe('constructor & factory', function () {
    it('should use environment host and port by default', function (done) {
      expect(monitor.host).to.equal(process.env.DATADOG_HOST);
      expect(monitor.port).to.equal(process.env.DATADOG_PORT);
      done();
    });

    it('should use environment prefix by default', function (done) {
      expect(monitor.prefix).to.equal(process.env.MONITOR_PREFIX);
      done();
    });

    it('should use environment interval by default', function (done) {
      expect(monitor.interval).to.equal(process.env.MONITOR_INTERVAL);
      done();
    });

    it('should construct a new monitor', function (done) {
      var custom = monitor.createMonitor();
      expect(custom.host).to.exist();
      expect(custom.port).to.exist();
      expect(custom.client).to.exist();
      done();
    })

    it('should use user defined host when specified', function (done) {
      var customHost = '10.12.14.18';
      var custom = monitor.createMonitor({
        host: customHost
      });
      expect(custom.host).to.equal(customHost);
      expect(monitor.port).to.equal(process.env.DATADOG_PORT);
      done();
    });

    it('should use user defined port when specified', function (done) {
      var customPort = '7777';
      var custom = monitor.createMonitor({
        port: customPort
      });
      expect(monitor.host).to.equal(process.env.DATADOG_HOST);
      expect(custom.port).to.equal(customPort);
      done();
    });

    it('should use user defined prefix when specified', function (done) {
      var customPrefix = 'prefix';
      var custom = monitor.createMonitor({
        prefix: customPrefix
      });
      expect(custom.prefix).to.equal(customPrefix);
      done();
    });

    it('should not use a prefix when not specified', function (done) {
      var envMonitorPrefix = process.env.MONITOR_PREFIX;
      delete process.env.MONITOR_PREFIX;
      var custom = monitor.createMonitor();
      expect(custom.prefix).to.be.null();
      process.env.MONITOR_PREFIX = envMonitorPrefix;
      done();
    });

    it('should use user defined interval when specified', function (done) {
      var customInterval = 2000;
      var custom = monitor.createMonitor({
        interval: customInterval
      });
      expect(custom.interval).to.equal(customInterval);
      done();
    });
  }); // end 'constructor & factory'
}); // end 'monitor'
