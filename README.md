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

// Trigger an increment with additional parameters
monitor.increment('requests', 1, ['env:prod', 'host': '127.0.0.1']);

// Trigger an increment with tags as object
monitor.increment('requests', 1, {env: 'prod', host: '127.0.0.1'});

// Trigger a gauge event (`myProject.404s`)
monitor.gauge('404s');

// Time requests...
var timer = monitor.timer('request.time');
request('http://example.com', function(req, res) {
  // Triggers a histogram event to `myProject.request.time`
  timer.stop();
});
```

## Interval Monitoring
Creating specialized periodic interval monitors (similar to the sockets monitor)
is fairly straight-forward. Here's an example of how it is done:

```js
var monitor = require('monitor-dog');
var IntervalMonitor = require('monitor-dog/lib/interval-monitor');
var util = require('util');

/**
 * 1. Subclass the IntervalMonitor class
 */
function MyCustomMonitor = function(monitor, prefix, interval) {
  IntervalMonitor.call(this, monitor, prefix, interval);
}
util.inherits(MyCustomMonitor, IntervalMonitor);

/**
 * 2. Define your run function to periodically monitor what you wish
 */
MyCustomMonitor.prototype.run = function() {
  // ... Perform custom periodic reporting here using this.monitor
}

// 3. Instantiate and start your new interval monitor!
(new MyCustomMonitor(monitor)).start();
```

## API Documentation

### .set, .increment, .decrement, .histogram, .gauge

These methods behave exactly as you would expect on a regular
[dogstatsd Client](https://www.npmjs.com/package/node-dogstatsd).

### .timer(name, [startNow])

Creates and returns new timer with the given `name`. Optional boolean
`startNow` can be provided to start the timer at a later date using the
`.start` method.

##### Synchronous
```js
// Create the timer
var sumTimer = monitor.timer('sum.time');

// Perform a computation
var sum = 0;
for (var i = 0; i < 1000000; i++) {
  sum += i;
}

// Call .stop() to send a histogram event named 'sum.time'
// with the recorded duration...
sumTimer.stop();
```

##### Asynchronous
```js
var requestTimer = monitor.timer('request.time');
request('/some/endpoint', function (err, res) {
  requestTimer.stop();
});
```

##### Delayed Use
```js
var delayedTime = monitor.timer('delayed.timer', false);

// ... Do some other stuff ...

delayedTimer.start();

// ... Do some more stuff ...

delayedTimer.stop();
```

### .startSocketsMonitor(), .stopSocketsMonitor()

Automatically track number of open & pending sockets and open files.

```js
// start monitoring once you start web server
// default interval defined by `process.env.MONITOR_INTERVAL`
monitor.startSocketsMonitor();

// stop monitoring before stopping web server
monitor.stopSocketsMonitor();
```

### .captureStreamEvents()

Capture stream events: `open`, `data`, `error`, `end`.

```js
monitor.captureStream('some-name', yourStream);
```

## License

MIT
