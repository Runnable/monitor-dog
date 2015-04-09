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
  describe('timer', function() {
    beforeEach(function (done) {
      dogstatsd.stubAll();
      done();
    });

    afterEach(function (done) {
      dogstatsd.restoreAll();
      done();
    });

    it('should start the timer by default', function (done) {
      var timer = monitor.timer('timer');
      expect(timer.startDate).to.exist();
      done();
    });

    it('should not start the timer if instructed to not do so', function (done) {
      var timer = monitor.timer('timer', false);
      expect(timer.startDate).to.not.exist();
      done();
    });

    it('should call client histogram method with correct name when stopped', function (done) {
      var timerName = 'timer';
      monitor.client.histogram.restore();
      sinon.stub(monitor.client, 'histogram', function (name, duration) {
        expect(name).to.equal(monitor.prefix + '.' + timerName);
        done();
      });
      var timer = monitor.timer(timerName);
      timer.stop();
    });

    it('should report a realistic duration when stopped', function (done) {
      var duration = 60;
      var timer = monitor.timer('timer');
      sinon.stub(timer, 'callback', function (duration) {
        expect(duration).about(duration, 15);
        done();
      });
      setTimeout(function () {
        timer.stop();
      }, duration);
    });

    it('should not attempt to start a timer multiple times', function (done) {
      var timer = monitor.timer('timer', false);
      timer.start();
      var originalDate = timer.startDate;
      timer.start();
      expect(timer.startDate).to.equal(originalDate);
      done();
    });

    it('should not execute the callback the timer is stopped before being started', function (done) {
      var timer = monitor.timer('timer', false);
      sinon.stub(timer, 'callback');
      timer.stop();
      expect(timer.callback.callCount).to.equal(0);
      timer.callback.restore();
      done();
    });
  }); // end 'timer'
}); // end 'monitor-dog'
