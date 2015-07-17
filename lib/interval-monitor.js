'use strict';

var exists = require('101/exists');

/**
 * Interval monitoring base class for monitor-dog.
 * @module monitor-dog:interval-monitor
 */
module.exports = IntervalMonitor;

/**
 * Abstract base class for all types of specialized monitors that report
 * information periodically over a given interval.
 * @param {monitor-dog.Monitor} Base monitor class for the interval monitor.
 * @param {string} prefix Prefix to use for the interval monitor.
 * @param {number} interval Amount of time between reports, in milliseconds.
 */
function IntervalMonitor(monitor, prefix, interval) {
  this.monitor = monitor;
  this.prefix = prefix || this.monitor.prefix;
  this.interval = interval || this.monitor.interval;
}

/**
 * Abstract method meant to report statistics periodically.
 */
IntervalMonitor.prototype.run = function() {
  throw new Error(
    'IntervalMonitor is abstract; subclasses must override the run() method.'
  );
};

/**
 * Starts the interval monitor. This method will have no effect if the interval
 * monitor has already been started.
 */
IntervalMonitor.prototype.start = function () {
  if (exists(this.intervalId)) { return; }
  this.intervalId = setInterval(
    this.run.bind(this),
    this.interval
  );
};

/**
 * Stops the interval monitor. This method will have no effect if the interval
 * monitor has not yet been started.
 */
IntervalMonitor.prototype.stop = function () {
  if (!exists(this.intervalId)) { return; }
  clearInterval(this.intervalId);
  this.intervalId = null;
};
