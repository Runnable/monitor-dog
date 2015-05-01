'use strict';

var child = require('child_process');
var globalAgent = require('http').globalAgent;
var exists = require('101/exists');

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
 * @param {monitor-dog~Monitor} monitor Monitor to use for reporting data.
 * @param {string} [prefix='socket'] Prefix for socket events.
 * @param {number} [interval=monitor.interval] Duration of the reporting
 *   interval. The SocketsMonitor will setup a `setInterval` and will report
 *   data every time it fires.
 */
function SocketsMonitor (monitor, prefix, interval) {
  this.monitor = monitor;
  this.prefix = prefix || 'socket';
  this.interval = interval || this.monitor.interval;
}

/**
 * Begin capturing socket stats.
 */
SocketsMonitor.prototype.start = function () {
  if (exists(this.intervalId)) { return; }
  this.intervalId = setInterval(
    this._captureSocketStats.bind(this),
    this.interval
  );
};

/**
 * Stop capturing socket stats.
 */
SocketsMonitor.prototype.stop = function () {
  if (!exists(this.intervalId)) { return; }
  clearInterval(this.intervalId);
  this.intervalId = null;
};

/**
 * Utility method to report the size of each collection in a given object.
 * @param {string} suffix Suffix to apply for the gauge name.
 * @param {object} object Object that contains collections.
 */
SocketsMonitor.prototype._gaugeCollections = function (suffix, object) {
  var pidTag = 'pid:' + process.pid;
  for (var key in object) {
    var action = this.prefix + '.' + suffix;
    var tags = [pidTag, 'target:' + key];
    this.monitor.gauge(action, object[key].length, 1, tags);
  }
};

/**
 * Captures and reports socket stats. This method is executed from the context
 * of the collection interval and should not be explictly called.
 */
SocketsMonitor.prototype._captureSocketStats = function () {
  var sockets = globalAgent.sockets;
  var requests = globalAgent.requests;
  var pidTag = 'pid:' + process.pid;
  var tags = [pidTag];

  this._gaugeCollections('open', sockets);
  this._gaugeCollections('pending', requests);

  child.exec('lsof -p ' + process.pid + ' | wc -l', function (err, stdout) {
    if (err) { return; }
    var action = this.prefix + '.openFiles';
    this.monitor.gauge(action, parseInt(stdout), 1, tags);
  }.bind(this));
};
