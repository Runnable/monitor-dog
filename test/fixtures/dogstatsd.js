'use strict';

var monitor = require('../../index.js');
var clientMethods = [
  'set', 'increment', 'decrement', 'histogram', 'gauge', 'send_data'
];
var sinon = require('sinon');

/**
 * Stubs all basic methods for the monitor's dogstatsd client.
 */
function stubAll() {
  clientMethods.forEach(function (methodName) {
    sinon.stub(monitor.client, methodName);
  });
}

/**
 * Restores all stubbed methods for the monitor's dogstatsd client.
 */
function restoreAll() {
  clientMethods.forEach(function (methodName) {
    monitor.client[methodName].restore();
  });
}

module.exports = {
  stubAll: stubAll,
  restoreAll: restoreAll
}
