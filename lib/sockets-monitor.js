'use strict';
var child = require('child_process');


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
  if (this.intervalId) { return; }
  this.intervalId = setInterval(this._captureSocketStats.bind(this), this.interval);
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
  var sockets = require('http').globalAgent.sockets;
  var request = require('http').globalAgent.requests;
  var key;

  var pidTag = 'pid:' + process.pid;

  for (key in sockets) {
    this.monitor.gauge(this.prefix + '.sockets_open', sockets[key].length, 1,
      ['target:' + key, pidTag]);
  }

  for (key in request) {
    this.monitor.gauge(this.prefix + '.sockets_pending', request[key].length, 1,
      ['target:' + key, pidTag]);
  }

  child.exec('lsof -p ' + process.pid + ' | wc -l', function (err, stdout) {
    if (err) { return; }
    this.monitor.gauge(this.prefix + '.openFiles', parseInt(stdout), 1, [pidTag]);
  }.bind(this));
};
