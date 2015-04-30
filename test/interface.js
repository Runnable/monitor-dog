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
var monitor = require('../index.js');
var dogstatsd = require('./fixtures/dogstatsd');

describe('monitor-dog', function() {
  describe('interface', function() {
    it('should expose a `createMonitor` factory method', function (done) {
      expect(monitor.createMonitor).to.exist();
      expect(typeof monitor.createMonitor).to.equal('function');
      done();
    });

    it('should expose a `set` method', function (done) {
      expect(monitor.set).to.exist();
      expect(typeof monitor.set).to.equal('function');
      done();
    });

    it('should expose a `increment` method', function (done) {
      expect(monitor.increment).to.exist();
      expect(typeof monitor.increment).to.equal('function');
      done();
    });

    it('should expose a `decrement` method', function (done) {
      expect(monitor.increment).to.exist();
      expect(typeof monitor.increment).to.equal('function');
      done();
    });

    it('should expose a `histogram` method', function (done) {
      expect(monitor.histogram).to.exist();
      expect(typeof monitor.histogram).to.equal('function');
      done();
    });

    it('should expose a `gauge` method', function (done) {
      expect(monitor.gauge).to.exist();
      expect(typeof monitor.gauge).to.equal('function');
      done();
    });

    it('should expose a `timer` method', function (done) {
      expect(monitor.timer).to.exist();
      expect(typeof monitor.timer).to.equal('function');
      done();
    });

    it('should expose a `startSocketsMonitor` method', function (done) {
      expect(monitor.startSocketsMonitor).to.exist();
      expect(typeof monitor.startSocketsMonitor).to.equal('function');
      done();
    });

    it('should expose a `stopSocketsMonitor` method', function (done) {
      expect(monitor.stopSocketsMonitor).to.exist();
      expect(typeof monitor.stopSocketsMonitor).to.equal('function');
      done();
    });

    it('should expose a `captureStreamEvents` method', function (done) {
      expect(monitor.captureStreamEvents).to.exist();
      expect(typeof monitor.captureStreamEvents).to.equal('function');
      done();
    });

    describe('timer', function () {
      it('should expose a `start` method', function (done) {
        var timer = monitor.timer('timer');
        expect(timer.start).to.exist();
        expect(typeof timer.start).to.equal('function');
        done();
      });

      it('should expose a `stop` method', function (done) {
        var timer = monitor.timer('timer');
        expect(timer.stop).to.exist();
        expect(typeof timer.stop).to.equal('function');
        done();
      });
    });

    describe('sockets-monitor', function () {
      it('should expose a `start` method', function (done) {
        var socketsMonitor = monitor.socketsMonitor;
        expect(socketsMonitor.start).to.exist();
        expect(typeof socketsMonitor.start).to.equal('function');
        done();
      });

      it('should expose a `stop` method', function (done) {
        var socketsMonitor = monitor.socketsMonitor;
        expect(socketsMonitor.stop).to.exist();
        expect(typeof socketsMonitor.stop).to.equal('function');
        done();
      });
    });

  }); // end 'interface'
}); // end 'monitor-dog'
