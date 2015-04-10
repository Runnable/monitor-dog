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
var http = require('http');
var child = require('child_process');

require('loadenv')('monitor-dog');
var monitor = require('../index.js');
var dogstatsd = require('./fixtures/dogstatsd');

var ctx = {};
describe('monitor-dog', function() {
  describe('sockets-monitor', function() {
    beforeEach(function (done) {
      dogstatsd.stubAll();
      ctx.originalGlobalAgent = http.globalAgent;
      done();
    });

    afterEach(function (done) {
      dogstatsd.restoreAll();
      http.globalAgent = ctx.originalGlobalAgent;
      done();
    });

    it('should not start started monitor', function (done) {
      var custom = monitor.createMonitor({interval: 50, prefix: 'git'});
      expect(custom.socketsMonitor.intervalId).to.not.exist();
      custom.startSocketsMonitor();
      var oldInterval = custom.socketsMonitor.intervalId;
      expect(oldInterval).to.exist();
      custom.startSocketsMonitor();
      expect(oldInterval).to.equal(custom.socketsMonitor.intervalId);
      done();
    });

    it('should stop monitor', function (done) {
      var custom = monitor.createMonitor({interval: 50, prefix: 'git'});
      expect(custom.socketsMonitor.intervalId).to.not.exist();
      custom.startSocketsMonitor();
      expect(custom.socketsMonitor.intervalId).to.exist();
      custom.stopSocketsMonitor();
      expect(custom.socketsMonitor.intervalId).to.not.exist();
      done();
    });

    it('should not stop stopped monitor', function (done) {
      var custom = monitor.createMonitor({interval: 50, prefix: 'git'});
      expect(custom.socketsMonitor.intervalId).to.not.exist();
      custom.startSocketsMonitor();
      expect(custom.socketsMonitor.intervalId).to.exist();
      custom.stopSocketsMonitor();
      expect(custom.socketsMonitor.intervalId).to.not.exist();
      custom.stopSocketsMonitor();
      expect(custom.socketsMonitor.intervalId).to.not.exist();
      done();
    });

    it('should start monitor and report open files data & sockets info', function (done) {
      var custom = monitor.createMonitor({interval: 50, prefix: 'git'});
      expect(custom.socketsMonitor.intervalId).to.not.exist();
      var stub = sinon.stub(custom, 'gauge');
      http.globalAgent.sockets = [{id: 1}];
      http.globalAgent.requests = [{id: 1}, {id: 2}];
      custom.startSocketsMonitor();
      expect(custom.socketsMonitor.intervalId).to.exist();
      setTimeout(function () {
        // 3 + 6 + 3
        expect(stub.callCount).to.equal(12);
        expect(stub.calledWith(
          sinon.match.string,
          sinon.match.number,
          sinon.match.number,
          sinon.match.array)).to.equal(true);
        done();
      }, 210);
    });

    it('should gracefully handle errors in child.exec', function (done) {
      var custom = monitor.createMonitor({interval: 50, prefix: 'git'});
      var stub = sinon.stub(custom, 'gauge');
      sinon.stub(child, 'exec').yields(new Error('Error'));
      http.globalAgent.sockets = [{id: 1}];
      http.globalAgent.requests = [{id: 3}];
      custom.startSocketsMonitor();
      setTimeout(function () {
        expect(stub.callCount).to.equal(8);
        child.exec.restore();
        done();
      }, 210);
    });
  }); // end 'sockets-monitor'
}); // end 'monitor-dog'
