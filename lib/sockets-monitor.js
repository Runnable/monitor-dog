'use strict';

var child = require('child_process');
var globalAgent = require('http').globalAgent;

/**
 * @module monitor-dog:sockets-monitor
 * @author Anand Kumar Patel
 * @author Anton Podviaznikov
 */
module.exports = SocketsMonitor;

/**
 * Monitor class for performing monitoring on:
 * - number of **open** sockets
 * - number of **pending** sockets
 * - number of **open** files
 * @class
 */
function SocketsMonitor (monitor, prefix, interval) {
  this.monitor = monitor;
  this.prefix = prefix;
  this.interval = interval;
}

/**
 * Start capturing of the sockets stats data.
 */
SocketsMonitor.prototype.start = function () {
  if (!this.intervalId) {
    this.intervalId = setInterval(this._captureSocketStats.bind(this), this.interval);
  }
};

/**
 * Stop capturing of the sockets stats data.
 */
SocketsMonitor.prototype.stop = function () {
  if (this.intervalId) {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
};

SocketsMonitor.prototype._captureSocketStats = function () {
  var sockets = globalAgent.sockets;
  var requests = globalAgent.requests;
  var pidTag = 'pid:' + process.pid;
  var tags = [pidTag];
  var self = this;
  function gaugeCollection (suffix, collection) {
    for (var key in collection) {
      var action = self.prefix + '.' + suffix;
      self.monitor.gauge(action, collection[key].length, 1, tags.concat('target:' + key));
    }
  }
  gaugeCollection('sockets_open', sockets);
  gaugeCollection('sockets_pending', requests);

  child.exec('lsof -p ' + process.pid + ' | wc -l', function (err, stdout) {
    if (err) { return; }
    var action = this.prefix + '.openFiles';
    this.monitor.gauge(action, parseInt(stdout), 1, tags);
  }.bind(this));
};
