'use strict';

var Monitor = require('./lib/monitor');

/**
 * Application Monitoring. Wraps datadog, and sets a prefix that is prepended to
 * the name of each event. Also exposes a helpful timer method.
 * @module monitor-dog
 * @author Ryan Sandor Richards
 */
module.exports = new Monitor();
