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
var monitor = require('../lib/monitor');
var IntervalMonitor = require('../lib/interval-monitor');

describe('IntervalMonitor', function() {
  var clock;
  var intervalMonitor;
  var defaultInterval = 1337;
  var defaultPrefix = 'prefix';

  beforeEach(function (done) {
    clock = sinon.useFakeTimers();
    intervalMonitor = new IntervalMonitor(
      monitor,
      defaultPrefix,
      defaultInterval
    );
    sinon.stub(intervalMonitor, 'run');
    done();
  });

  afterEach(function (done) {
    clock.restore();
    done();
  });

  describe('constructor', function() {
    it('should set the given monitor', function(done) {
      expect(intervalMonitor.monitor).to.equal(monitor);
      done();
    });

    it('should set the given prefix', function(done) {
      expect(intervalMonitor.prefix).to.equal(defaultPrefix);
      done();
    });

    it('should use the monitor prefix if none was given', function(done) {
      var noPrefix = new IntervalMonitor(monitor);
      expect(noPrefix.prefix).to.equal(monitor.prefix);
      done();
    });

    it('should set the given interval', function(done) {
      expect(intervalMonitor.interval).to.equal(defaultInterval);
      done();
    });

    it('should set the monitor interval if none was given', function(done) {
      var noInterval = new IntervalMonitor(monitor);
      expect(noInterval.interval).to.equal(monitor.interval);
      done();
    });
  });

  describe('.run()', function() {
    it('should be abstract and throw an error if called', function(done) {
      intervalMonitor.run.restore();
      expect(intervalMonitor.run).throws();
      done();
    });
  });

  describe('.start()', function() {
    it('should start the correct "run" interval', function(done) {
      intervalMonitor.start();
      clock.tick(defaultInterval);
      expect(intervalMonitor.run.calledOnce).to.be.true();
      done();
    });

    it('should not start the interval multiple times', function(done) {
      intervalMonitor.start();
      intervalMonitor.start();
      intervalMonitor.start();
      clock.tick(defaultInterval);
      expect(intervalMonitor.run.calledOnce).to.be.true();
      done();
    });
  });

  describe('.stop()', function() {
    it('should stop the "run" interval', function(done) {
      intervalMonitor.start();
      intervalMonitor.stop();
      clock.tick(defaultInterval);
      expect(intervalMonitor.run.callCount).to.equal(0);
      done();
    });

    it('should not attempt to stop the interval twice', function(done) {
      intervalMonitor.start();
      try {
        intervalMonitor.stop();
        intervalMonitor.stop();
      }
      catch (e) {
        return done(e);
      }
      done();
    });
  });
});
