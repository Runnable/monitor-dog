'use strict';

var EventEmitter = require('events').EventEmitter;
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var afterEach = lab.afterEach;
var Code = require('code');
var expect = Code.expect;
var sinon = require('sinon');

require('loadenv')('monitor-dog');
var monitor = require('../index.js');
var dogstatsd = require('./fixtures/dogstatsd');

describe('monitor-dog', function() {
  describe('behavior', function() {
    beforeEach(function (done) {
      dogstatsd.stubAll();
      done();
    });

    afterEach(function (done) {
      dogstatsd.restoreAll();
      done();
    });

    describe('constructor & factory', function () {
      it('should use environment host and port by default', function (done) {
        expect(monitor.host).to.equal(process.env.DATADOG_HOST);
        expect(monitor.port).to.equal(process.env.DATADOG_PORT);
        done();
      });

      it('should use environment prefix by default', function (done) {
        expect(monitor.prefix).to.equal(process.env.MONITOR_PREFIX);
        done();
      });

      it('should use environment interval by default', function (done) {
        expect(monitor.interval).to.equal(process.env.MONITOR_INTERVAL);
        done();
      });

      it('should construct a new monitor', function (done) {
        var custom = monitor.createMonitor();
        expect(custom.host).to.exist();
        expect(custom.port).to.exist();
        expect(custom.client).to.exist();
        done();
      })

      it('should use user defined host when specified', function (done) {
        var customHost = '10.12.14.18';
        var custom = monitor.createMonitor({
          host: customHost
        });
        expect(custom.host).to.equal(customHost);
        expect(monitor.port).to.equal(process.env.DATADOG_PORT);
        done();
      });

      it('should use user defined port when specified', function (done) {
        var customPort = '7777';
        var custom = monitor.createMonitor({
          port: customPort
        });
        expect(monitor.host).to.equal(process.env.DATADOG_HOST);
        expect(custom.port).to.equal(customPort);
        done();
      });

      it('should use user defined prefix when specified', function (done) {
        var customPrefix = 'prefix';
        var custom = monitor.createMonitor({
          prefix: customPrefix
        });
        expect(custom.prefix).to.equal(customPrefix);
        done();
      });

      it('should not use a prefix when not specified', function (done) {
        var envMonitorPrefix = process.env.MONITOR_PREFIX;
        delete process.env.MONITOR_PREFIX;
        var custom = monitor.createMonitor();
        expect(custom.prefix).to.be.null();
        process.env.MONITOR_PREFIX = envMonitorPrefix;
        done();
      });

      it('should use user defined interval when specified', function (done) {
        var customInterval = 2000;
        var custom = monitor.createMonitor({
          interval: customInterval
        });
        expect(custom.interval).to.equal(customInterval);
        done();
      });
    });

    describe('helper aliases', function () {
      it('should send sets through datadog', function (done) {
        var key = 'example.set';
        var keyWithPrefix = monitor.prefix + '.' + key;
        var value = 1337;
        var sampleRate = '1s';
        var tags = 'tag1 tag2';
        var stub = monitor.client.set;
        monitor.set(key, value, sampleRate, tags);
        expect(stub.calledOnce).to.be.true();
        expect(stub.calledWith(keyWithPrefix, value, sampleRate, tags)).to.be.true();
        done();
      });

      it('should send counter increments through datadog', function (done) {
        var key = 'example.counter';
        var keyWithPrefix = monitor.prefix + '.' + key;
        var value = 42;
        var sampleRate = '1d';
        var tags = 'my tags';
        var stub = monitor.client.increment;
        monitor.increment(key, value, sampleRate, tags);
        expect(stub.calledOnce).to.be.true();
        expect(stub.calledWith(keyWithPrefix, value, sampleRate, tags)).to.be.true();
        done();
      });

      it('should convert tags as object to array before sending data through datadog', function (done) {
        var key = 'example.counter';
        var keyWithPrefix = monitor.prefix + '.' + key;
        var value = 42;
        var sampleRate = '1d';
        var tags = {
          env: 'prod',
          count: 112
        };
        var stub = monitor.client.increment;
        monitor.increment(key, value, sampleRate, tags);
        expect(stub.calledOnce).to.be.true();
        expect(stub.calledWith(keyWithPrefix, value, sampleRate, ['env:prod', 'count:112'])).to.be.true();
        done();
      });

      it('should convert replace colons in the tag keys/values with _', function (done) {
        var key = 'example.counter';
        var keyWithPrefix = monitor.prefix + '.' + key;
        var value = 42;
        var sampleRate = '1d';
        var tags = {
          'env:x:y': 'prod:1',
          count: 112
        };
        var stub = monitor.client.increment;
        monitor.increment(key, value, sampleRate, tags);
        expect(stub.calledOnce).to.be.true();
        expect(stub.calledWith(keyWithPrefix, value, sampleRate, ['env_x_y:prod_1', 'count:112'])).to.be.true();
        done();
      });

      it('should ignore tags with non-plain values', function (done) {
        var key = 'example.counter';
        var keyWithPrefix = monitor.prefix + '.' + key;
        var value = 42;
        var sampleRate = '1d';
        var tags = {
          env: 'prod',
          count: 112,
          foo: true,
          arr: [1, 2, 3],
          obj: {
            x: 1
          }
        };
        var stub = monitor.client.increment;
        monitor.increment(key, value, sampleRate, tags);
        expect(stub.calledOnce).to.be.true();
        expect(stub.calledWith(keyWithPrefix, value, sampleRate, ['foo:true', 'env:prod', 'count:112'])).to.be.true();
        done();
      });

      it('should send counter decrements through datadog', function (done) {
        var key = 'example.counter';
        var keyWithPrefix = monitor.prefix + '.' + key;
        var value = 42;
        var sampleRate = '1d';
        var tags = 'my tags';
        var stub = monitor.client.decrement;
        monitor.decrement(key, value, sampleRate, tags);
        expect(stub.calledOnce).to.be.true();
        expect(stub.calledWith(keyWithPrefix, value, sampleRate, tags)).to.be.true();
        done();
      });

      it('should send histograms through datadog', function (done) {
        var key = 'example.histogram';
        var keyWithPrefix = monitor.prefix + '.' + key;
        var value = 420;
        var sampleRate = '1w';
        var tags = 'mah tagz';
        var stub = monitor.client.histogram;
        monitor.histogram(key, value, sampleRate, tags);
        expect(stub.calledOnce).to.be.true();
        expect(stub.calledWith(keyWithPrefix, value, sampleRate, tags)).to.be.true();
        done();
      });

      it('should send gauges through datadog', function (done) {
        var key = 'speed.of.light';
        var keyWithPrefix = monitor.prefix + '.' + key;
        var value = 299792458;
        var sampleRate = '1yr';
        var tags = 'einstein is cool';
        var stub = monitor.client.gauge;
        monitor.gauge(key, value, sampleRate, tags);
        expect(stub.calledOnce).to.be.true();
        expect(stub.calledWith(keyWithPrefix, value, sampleRate, tags)).to.be.true();
        done();
      });

      it('methods should not use a prefix if none was specified', function (done) {
        var envMonitorPrefix = process.env.MONITOR_PREFIX;
        delete process.env.MONITOR_PREFIX;

        var custom = monitor.createMonitor();
        var methods = ['set', 'increment', 'histogram', 'gauge'];
        methods.forEach(function (method) {
          var stub = sinon.stub(custom.client, method);
          var key = 'key';
          custom[method](key);

          expect(stub.calledWith(key)).to.be.true();
          custom.client[method].restore();
        });

        process.env.MONITOR_PREFIX = envMonitorPrefix;
        done();
      });

      it('should call socketsMonitor.start', function (done) {
        var custom = monitor.createMonitor();
        var stub = sinon.stub(custom.socketsMonitor, 'start');
        custom.startSocketsMonitor();
        expect(stub.calledOnce).to.be.true();
        done();
      });

      it('should call socketsMonitor.stop', function (done) {
        var custom = monitor.createMonitor();
        var stub = sinon.stub(custom.socketsMonitor, 'stop');
        custom.stopSocketsMonitor();
        expect(stub.calledOnce).to.be.true();
        done();
      });


      it('should convert object to tags array', function (done) {
        var custom = monitor.createMonitor();
        var tags = custom._toTags({env: 'test', count: 112});
        expect(tags.length).to.equal(2);
        expect(tags[0]).to.equal('env:test');
        expect(tags[1]).to.equal('count:112');
        done();
      });

      it('should capture stream events', function (done) {
        var custom = monitor.createMonitor();
        var stream = new EventEmitter();
        custom.captureStreamEvents('my-stream', stream);
        var stub = sinon.stub(custom, 'increment');
        stream.emit('open');
        stream.emit('data');
        stream.emit('error');
        stream.emit('end');
        expect(stub.getCalls().length).to.equal(4);
        expect(stub.getCall(0).args[0]).to.equal('my-stream.open');
        expect(stub.getCall(1).args[0]).to.equal('my-stream.data');
        expect(stub.getCall(2).args[0]).to.equal('my-stream.error');
        expect(stub.getCall(3).args[0]).to.equal('my-stream.end');
        done();
      });

      it('should not capture stream if streamName is null', function (done) {
        var custom = monitor.createMonitor();
        var stream = new EventEmitter();
        var result = custom.captureStreamEvents(null, stream);
        expect(result).to.be.false();
        done();
      });

      it('should not capture stream if stream is null', function (done) {
        var custom = monitor.createMonitor();
        var result = custom.captureStreamEvents('my-stream', null);
        expect(result).to.be.false();
        done();
      });
    }); // end 'helper aliases'

    describe('event', function() {
      it('should throw an error when not given options', function(done) {
        expect(monitor.event).throws();
        done();
      });

      it('should throw an error if the title is missing', function(done) {
        var error = null;
        try {
          monitor.event({});
        }
        catch (e) {
          error = e;
        }
        expect(error).to.not.be.null();
        done();
      });

      it('should throw an error if the text is missing', function(done) {
        var error = null;
        try {
          monitor.event({ title: 'some title' });
        }
        catch (e) {
          error = e;
        }
        expect(error).to.not.be.null();
        done();
      });

      it('should correctly format a basic event', function(done) {
        var title = 'title';
        var text = 'this is the text';
        var expectedFormat = '_e{' + title.length + ',' + text.length + '}:' +
          title + '|' + text;
        monitor.event({ title: title, text: text });
        expect(monitor.client.send_data.calledWith(expectedFormat))
          .to.be.true();
        done();
      });

      it('should add the date_happened option', function(done) {
        var title = 'dated event title';
        var text = 'this is the text for the dated event';
        var date_happened = 1234;
        var expected = '_e{' + title.length + ',' + text.length + '}:' +
          title + '|' + text + '|d:' + date_happened;
        var options = {
          title: title,
          text: text,
          date_happened: date_happened
        };
        monitor.event(options);
        expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        done();
      });

      it('should ignore non-number date_happened option', function(done) {
        var title = 'dated event title 2';
        var text = 'this is the text for the dated eventzzz';
        var date_happened = 'aawwwuuuuueeee';
        var expected = '_e{' + title.length + ',' + text.length + '}:' +
          title + '|' + text;
        var options = {
          title: title,
          text: text,
          date_happened: date_happened
        };
        monitor.event(options);
        expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        done();
      });

      it('should add a valid hostname option', function(done) {
        var title = 'event with hostname';
        var text = 'omg omg omg omg';
        var hostname = 'validhost';
        var expected = '_e{' + title.length + ',' + text.length + '}:' +
          title + '|' + text + '|h:' + hostname;
        var options = {
          title: title,
          text: text,
          hostname: hostname
        };
        monitor.event(options);
        expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        done();
      });

      it('should ignore invalid hostname options', function(done) {
        var title = 'event with hostname';
        var text = 'omg omg omg omg';
        var hostname = {'invalidhost': 23};
        var expected = '_e{' + title.length + ',' + text.length + '}:' +
          title + '|' + text;
        var options = {
          title: title,
          text: text,
          hostname: hostname
        };
        monitor.event(options);
        expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        done();
      });

      it('should add a valid aggregation_key option', function(done) {
        var title = 'event with aggregation_key';
        var text = 'ssssuuupppeeerrrmmmmaannnn';
        var aggregation_key = 'validkey';
        var expected = '_e{' + title.length + ',' + text.length + '}:' +
          title + '|' + text + '|k:' + aggregation_key;
        var options = {
          title: title,
          text: text,
          aggregation_key: aggregation_key
        };
        monitor.event(options);
        expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        done();
      });

      it('should ignore an invalid aggregation_key option', function(done) {
        var title = 'event with aggregation_key das badz';
        var text = 'bbbbaaaatttmmmmaannnn';
        var aggregation_key = { neat: 'wow' };
        var expected = '_e{' + title.length + ',' + text.length + '}:' +
          title + '|' + text;
        var options = {
          title: title,
          text: text,
          aggregation_key: aggregation_key
        };
        monitor.event(options);
        expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        done();
      });

      it('should add valid priority options', function(done) {
        var title = 'priority event title';
        var text = 'priority event text';
        var valid = ['low', 'normal'];
        valid.forEach(function (priority) {
          var expected = '_e{' + title.length + ',' + text.length + '}:' +
            title + '|' + text + '|p:' + priority;
          var options = {
            title: title,
            text: text,
            priority: priority
          };
          monitor.event(options);
          expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        });
        done();
      });

      it('should ignore invalid priority options', function(done) {
        var title = 'priority event title';
        var text = 'priority event text';
        var expected = '_e{' + title.length + ',' + text.length + '}:' +
          title + '|' + text;
        var options = {
          title: title,
          text: text,
          priority: 'not a valid priority'
        };
        monitor.event(options);
        expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        done();
      });

      it('should ignore non-string priority options', function(done) {
        var title = 'priority event title';
        var text = 'priority event text';
        var expected = '_e{' + title.length + ',' + text.length + '}:' +
          title + '|' + text;
        var options = {
          title: title,
          text: text,
          priority: { schrrooo: 'slslmmggggrrrggf' }
        };
        monitor.event(options);
        expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        done();
      });

      it('should add valid alert type options', function(done) {
        var title = 'alert event title';
        var text = 'alert event text';
        var validTypes = ['error', 'warning', 'info', 'success'];
        validTypes.forEach(function (type) {
          var expected = '_e{' + title.length + ',' + text.length + '}:' +
            title + '|' + text + '|t:' + type;
          var options = {
            title: title,
            text: text,
            alert_type: type
          };
          monitor.event(options);
          expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        });
        done();
      });

      it('should not add invalid alert types', function(done) {
        var title = 'alert event title';
        var text = 'alert event text';
        var alert_type = 'notathing';
        var expected = '_e{' + title.length + ',' + text.length + '}:' +
          title + '|' + text;
        var options = {
          title: title,
          text: text,
          alert_type: alert_type
        };
        monitor.event(options);
        expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        done();
      });

      it('should not add a non-string alert type', function(done) {
        var title = 'alert event title';
        var text = 'alert event text';
        var alert_type = { foo: 'bar' };
        var expected = '_e{' + title.length + ',' + text.length + '}:' +
          title + '|' + text;
        var options = {
          title: title,
          text: text,
          alert_type: alert_type
        };
        monitor.event(options);
        expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        done();
      });

      it('should add optional tags', function(done) {
        var title = 'tags event';
        var text = 'tags event text';
        var expected = '_e{' + title.length + ',' + text.length + '}:' +
          title + '|' + text + '|#alpha,beta:sweet,vallhalla';
        var options = {
          title: title,
          text: text,
          tags: ['alpha', 'beta:sweet', 'vallhalla']
        };
        monitor.event(options);
        expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        done();
      });

      it('should ignore non-array tags', function(done) {
        var title = 'tags event';
        var text = 'tags event text';
        var expected = '_e{' + title.length + ',' + text.length + '}:' +
          title + '|' + text;
        var options = {
          title: title,
          text: text,
          tags: 'durnp'
        };
        monitor.event(options);
        expect(monitor.client.send_data.calledWith(expected)).to.be.true();
        done();
      });
    }); // end 'event'
  }); // end 'behavior'
}); // end 'monitor-dog'
