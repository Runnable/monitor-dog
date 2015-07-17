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
var http = require('http');
var child = require('child_process');

require('loadenv')('monitor-dog');
var monitor = require('../index.js');
var SocketsMonitor = require('../lib/sockets-monitor');
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

    describe('constructor', function() {
      it('should use given socket prefix', function(done) {
        var socketMonitor = new SocketsMonitor({}, 'prefix', 1000);
        expect(socketMonitor.prefix).to.equal('prefix');
        done();
      });

      it('should use a default socket prefix if none given', function(done) {
        var socketMonitor = new SocketsMonitor({}, null, 1000);
        expect(socketMonitor.prefix).to.equal('socket');
        done();
      });
    });

    it('should start monitor and report open files data & sockets info', function (done) {
      http.globalAgent.sockets = [{id: 1}];
      http.globalAgent.requests = [{id: 1}, {id: 2}];

      var numSockets = http.globalAgent.sockets.length;
      var numRequests = http.globalAgent.requests.length;
      var ticks = 2;
      var interval = 50;
      var custom = monitor.createMonitor({interval: interval, prefix: 'git'});
      var stub = sinon.stub(custom, 'gauge');
      var clock = sinon.useFakeTimers();
      sinon.stub(child, 'exec').yields(null, '10');

      // Start the monitor and push the clock forward a few ticks...
      custom.startSocketsMonitor();
      clock.tick(ticks * interval + 1);

      // Every tick it should make one call every socket, every request, and an
      // additional call for the number of open files.
      expect(stub.callCount).to.equal(ticks * (numSockets + numRequests + 1));
      expect(stub.calledWith(
        sinon.match.string,
        sinon.match.number,
        sinon.match.number,
        sinon.match.array)).to.equal(true);

      child.exec.restore();
      clock.restore();
      done();
    });

    it('should gracefully handle errors in child.exec', function (done) {
      http.globalAgent.sockets = [{id: 1}, {id: 2}, {id: 3}];
      http.globalAgent.requests = [{id: 4}, {id: 5}];

      var numSockets = http.globalAgent.sockets.length;
      var numRequests = http.globalAgent.requests.length;
      var ticks = 2;
      var interval = 50;
      var custom = monitor.createMonitor({interval: interval, prefix: 'git'});
      var stub = sinon.stub(custom, 'gauge');
      var clock = sinon.useFakeTimers();
      sinon.stub(child, 'exec').yields(new Error('Error'));

      custom.startSocketsMonitor();
      clock.tick(ticks * interval + 1);

      // This should not make gauge call for open files
      expect(stub.callCount).to.equal(ticks * (numSockets + numRequests));

      child.exec.restore();
      clock.restore();
      done();
    });
  }); // end 'sockets-monitor'
}); // end 'monitor-dog'
