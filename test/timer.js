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
var Timer = require('../lib/timer.js');

describe('Timer', function() {
  describe('interface', function () {
    it('should expose a `start` method', function (done) {
      expect(Timer.prototype.start).to.be.a.function();
      done();
    });

    it('should expose a `stop` method', function (done) {
      expect(Timer.prototype.stop).to.be.a.function();
      done();
    });
  }); // end 'interface'

  describe('constructor', function() {
    it('should start the timer', function(done) {
      sinon.spy(Timer.prototype, 'start');
      var t = new Timer(function() {});
      expect(Timer.prototype.start.calledOnce).to.be.true();
      Timer.prototype.start.restore();
      done();
    });

    it('should start the timer when explicitly told to do so', function(done) {
      sinon.spy(Timer.prototype, 'start');
      var t = new Timer(function() {}, true);
      expect(Timer.prototype.start.calledOnce).to.be.true();
      Timer.prototype.start.restore();
      done();
    });

    it('should not start the timer when instructed', function(done) {
      sinon.spy(Timer.prototype, 'start');
      var t = new Timer(function() {}, false);
      expect(Timer.prototype.start.callCount).to.equal(0);
      Timer.prototype.start.restore();
      done();
    });
  }); // end 'constructor'

  describe('start', function() {
    var clock;
    var timer;

    beforeEach(function (done) {
      clock = sinon.useFakeTimers();
      timer = new Timer(function() {}, false);
      done();
    });

    afterEach(function (done) {
      clock.restore();
      done();
    });

    it('should set the start date', function(done) {
      expect(timer.startDate).to.be.null();
      timer.start();
      expect(timer.startDate).to.not.be.null();
      done();
    });

    it('should not set the date if called multiple times', function(done) {
      timer.start();
      var date = timer.startDate;
      clock.tick(3600);
      timer.start();
      timer.start();
      timer.start();
      expect(timer.startDate).to.equal(date);
      done();
    });
  }); // end 'start'

  describe('stop', function() {
    var clock;
    var timer;

    beforeEach(function (done) {
      clock = sinon.useFakeTimers();
      timer = new Timer(function() {}, false);
      sinon.spy(timer, 'callback');
      done();
    });

    afterEach(function (done) {
      clock.restore();
      done();
    });

    it('should not execute the callback if not started', function(done) {
      timer.stop();
      expect(timer.callback.callCount).to.equal(0);
      done();
    });

    it('should execute the callback with the duration', function(done) {
      var duration = 13371;
      timer.start();
      clock.tick(duration);
      timer.stop();
      expect(timer.callback.calledOnce).to.be.true();
      expect(timer.callback.calledWith(duration)).to.be.true();
      done();
    });
  }); // end 'stop'
}); // end 'Timer'
