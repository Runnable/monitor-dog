'use strict';

require('loadenv')('monitor-dog');
var StatsD = require('node-dogstatsd').StatsD;
var exists = require('101/exists');
var SocketsMonitor = require('./sockets-monitor');

/**
 * @module monitor-dog:monitor
 * @author Ryan Sandor Richards
 */
module.exports = Monitor;

/**
 * Monitoring and reporting.
 * @class
 * @param {object} opt Monitor options.
 * @param {string} [opt.prefix] User defined event prefix.
 * @param {string} [opt.host] Datadog host.
 * @param {string} [opt.port] Datadog port.
 * @param {string} [opt.interval] Sockets Monitor stats poll interval
 */
function Monitor(opt) {
  opt = opt || {};
  this.prefix = opt.prefix || process.env.MONITOR_PREFIX || null;
  this.host = opt.host || process.env.DATADOG_HOST;
  this.port = opt.port || process.env.DATADOG_PORT;
  this.interval = opt.interval || process.env.MONITOR_INTERVAL;
  this.client = new StatsD(this.host, this.port);
  this.socketsMonitor = new SocketsMonitor(this, this.prefix, this.interval);
}

/**
 * Factory method for creating custom monitors. Implemented as an instance
 * method since we are exporting a monitor instance.
 * @param {object} opt Monitor options.
 */
Monitor.prototype.createMonitor = function (opt) {
  return new Monitor(opt);
};

/**
 * Helper aliases for `monitor.client.*`.
 */
['set', 'increment', 'decrement', 'histogram', 'gauge'].forEach(function (method) {
  Monitor.prototype[method] = function() {
    var args = Array.prototype.slice.call(arguments);
    if (this.prefix) {
      args[0] = [this.prefix, args[0]].join('.');
    }
    this.client[method].apply(this.client, args);
  };
});

/**
 * Creates a new timer for the given histogram name.
 *
 * @example
 * // Create and start a new timer
 * var myTimer = monitor.timer('function.time');
 * // Stop the timer once the task is complete
 * // This sends the information to a histogram named 'function.time'
 * doSomething();
 * myTimer.stop();
 *
 * @example
 * // Time an asynchonous process
 * var myTimer = monitor.timer('function.async.time');
 * asyncTask(function(result) {
 *   // Stop the timer and send information to datadog
 *   myTimer.stop();
 * });
 *
 * @param {string} histName Name of the histogram to report the timer's output.
 * @param {boolean} [start] Whether or not to immediately start timing,
 *   default: `true`.
 * @return {Timer} Timer object that can be stopped when timing is finished.
 */
Monitor.prototype.timer = function (histName, start) {
  var self = this;
  return new Timer(function (duration) {
    self.histogram(histName, duration);
  }, start);
};


/**
 * Starts sockets stats data monitoring.
 */
Monitor.prototype.startSocketsMonitor = function () {
  this.socketsMonitor.start();
};

/**
 * Stops sockets stats data monitoring.
 */
Monitor.prototype.stopSocketsMonitor = function () {
  this.socketsMonitor.stop();
};

/**
 * Timer class for performing time calculations through the monitor
 * module.
 * @class
 */
function Timer(callback, start) {
  this.callback = callback;
  if (!exists(start) || start !== false) {
    this.start();
  }
}

/**
 * Starts the timer.
 */
Timer.prototype.start = function () {
  if (this.startDate) {
    return;
  }
  this.startDate = new Date();
};

/**
 * Stops the timer and sends information through datadog.
 */
Timer.prototype.stop = function () {
  if (!this.startDate) {
    return;
  }
  this.callback(new Date() - this.startDate);
};
