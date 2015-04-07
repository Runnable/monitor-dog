# monitor-dog

![Build Status](https://travis-ci.org/Runnable/monitor-dog.svg?branch=master)
![Dependency Status](https://david-dm.org/Runnable/monitor-dog.svg)
![devDependency Status](https://david-dm.org/Runnable/monitor-dog/dev-status.svg)

[![NPM](https://nodei.co/npm/monitor-dog.png?compact=true)](https://nodei.co/npm/monitor-dog)

Wraps [dogstatsd](https://www.npmjs.com/package/node-dogstatsd) to provide
environment based event scoping (prefixing) and timers.

## Usage

```js
// Assume `process.env.MONITOR_PREFIX === 'myProject'`, then all events
// triggered via monitor dog will be prefixed with `myProject.`.
var monitor = require('monitor-dog');

// Trigger an increment (`myProject.requests`)
monitor.increment('requests');

// Trigger a gauge event (`myProject.404s`)
monitor.gauge('404s');

// Time requests...
var timer = monitor.timer('request.time');
request('http://example.com', function(req, res) {
  // Triggers a histogram event to `myProject.request.time`
  timer.stop();
});
```
