'use strict';

var exists = require('101/exists');

/**
 * Timer module for monitor-dog.
 * @author Ryan Sandor Richards
 * @module monitor-dog:timer
 */
module.exports = Timer;

/**
 * Timer class for performing time calculations through the monitor
 * module.
 * @class
 * @param {function} callback Callback to execute when the timer is stopped.
 * @param {boolean} start Whether or not to start the timer upon construction,
 *                        default: `true`.
 */
function Timer (callback, start) {
  this.callback = callback;
  this.startDate = null;
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
