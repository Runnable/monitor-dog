'use strict';

require('loadenv')('monitor-dog');
var StatsD = require('node-dogstatsd').StatsD;
var compose = require('101/compose');
var exists = require('101/exists');
var isObject = require('101/is-object');
var isBoolean = require('101/is-boolean');
var isString = require('101/is-string');
var isNumber = require('101/is-number');
var pluck = require('101/pluck');

var Timer = require('./timer');
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
function Monitor (opt) {
  opt = opt || {};
  this.prefix = opt.prefix || process.env.MONITOR_PREFIX || null;
  this.host = opt.host || process.env.DATADOG_HOST;
  this.port = opt.port || process.env.DATADOG_PORT;
  this.interval = opt.interval || process.env.MONITOR_INTERVAL;
  if (this.host && this.port) {
    this.client = new StatsD(this.host, this.port);
    this.socketsMonitor = new SocketsMonitor(this);
  }
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
 * Utility function to escape `:` with `_` in the tags keys/values.
 */
function _escapeTagToken (token) {
  return token.replace(/:/g, '_');
}

/**
 * Utility function for converting object into array of tags in the
 * ['key1:value1', 'key2:value2'] format
 */
 Monitor.prototype._toTags = function (json) {
  var keyPluck = pluck.bind(null, json);
  var booleans = Object.keys(json).filter(compose(isBoolean, keyPluck));
  var strings = Object.keys(json).filter(compose(isString, keyPluck));
  var numbers = Object.keys(json).filter(compose(isNumber, keyPluck));
  var keys = booleans.concat(strings, numbers);
  return keys.map(function (key) {
    return _escapeTagToken(key) + ':' + _escapeTagToken(String(json[key]));
  });
};

/**
 * Helper aliases for `monitor.client.*`.
 */

var methodNames = ['set', 'increment', 'decrement', 'histogram', 'gauge'];
methodNames.forEach(function (method) {
  Monitor.prototype[method] = function () {
    if (!this.client) {
      return
    }

    var args = Array.prototype.slice.call(arguments);
    if (this.prefix) {
      args[0] = [this.prefix, args[0]].join('.');
    }
    var lastArgIndex = args.length - 1;
    if (isObject(args[lastArgIndex])) {
      args[lastArgIndex] = this._toTags(args[lastArgIndex]);
    }
    this.client[method].apply(this.client, args);
  };
});

/**
 * Sends an event to datadog.
 *
 * @example
 * monitor.event({
 *   title: 'Docker Build Failure',
 *   text: 'Failed to build container ' + name + ' with id ' + id
 * });
 *
 * @param {string} opt.title Title for the event (required).
 * @param {string} opt.text Text for the event (required).
 * @param {number} opt.date_happened Optional timestamp for when the event
 *                                   occurred.
 * @param {string} opt.hostname Optional host name for the event.
 * @param {string} opt.aggregation_key Optional grouping key for the event.
 * @param {string} opt.priority Optional priority can be 'normal' or 'low'.
 * @param {string} opt.source_type_name Optional source type for the event.
 * @param {string} opt.alert_type Optional alert level can be 'error',
 *                                'warning', 'info', 'success'.
 * @param {Array}  opt.tags Array of tags to associate with the event.
 * @throws Error If opt.title or opt.text are missing.
 * @see http://docs.datadoghq.com/guides/dogstatsd/#datagram-format
 */
Monitor.prototype.event = function (opt) {
  if (!this.client) {
    return
  }
  if (!isObject(opt)) {
    throw new Error('Missing required options');
  }
  if (!opt.title) {
    throw new Error('Missing required title option');
  }
  if (!opt.text) {
    throw new Error('Missing required text option');
  }

  //_e{title.length,text.length}:title|text
  var buf = [
    '_e{', opt.title.length, ',', opt.text.length, '}:',
    sanitize(opt.title), '|', sanitize(opt.text)
  ];

  //|d:date_happened
  if (isNumber(opt.date_happened)) {
    buf.push('|d:', parseInt(opt.date_happened));
  }

  //|h:hostname
  pushIfString('|h:', opt.hostname);

  //|k:aggregation_key
  pushIfString('|k:', opt.aggregation_key);

  //|p:priority
  if (
    isString(opt.priority) &&
    (opt.priority === 'low' || opt.priority === 'normal')
  ) {
    buf.push('|p:', opt.priority);
  }

  //|t:alert_type
  if (
    isString(opt.alert_type) &&
    (
      opt.alert_type === 'error' ||
      opt.alert_type === 'warning' ||
      opt.alert_type === 'info' ||
      opt.alert_type === 'success'
    )
  ) {
    buf.push('|t:', opt.alert_type);
  }

  //|#tag1,tag2
  if (Array.isArray(opt.tags)) {
    var tags = opt.tags.map(function (tag) {
      return tag.replace(/,/g, '');
    }).join(',');
    buf.push('|#', tags);
  }

  // Send the data using the dogstatsd client
  this.client.send_data(new Buffer(buf.join('')));

  function sanitize(s) {
    return s.replace(/[|]/g, '');
  }

  function pushIfString(prefix, value) {
    if (isString(value)) {
      buf.push(prefix, sanitize(value));
    }
  }
};

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
 * @param {Object} [tags] Optional tags for the event.
 * @return {Timer} Timer object that can be stopped when timing is finished.
 */
Monitor.prototype.timer = function (histName, start, tags) {
  var self = this;
  return new Timer(function (duration) {
    self.histogram(histName, duration, tags);
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
 * Capture stream events: `open`, `data`, `error` and `end`.
 */
Monitor.prototype.captureStreamEvents = function (streamName, stream) {
  if (!stream || !streamName) {
    return false;
  }
  var self = this;
  var sendEvent = function (suffix) {
    return function () {
      self.increment(streamName + '.' + suffix);
    };
  };
  stream.on('data', sendEvent('data'));
  stream.on('end', sendEvent('end'));
  stream.on('open', sendEvent('open'));
  stream.on('error', sendEvent('error'));
};
