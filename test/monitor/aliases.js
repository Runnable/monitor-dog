'use strict';

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
var monitor = require('../../index.js');
var dogstatsd = require('../fixtures/dogstatsd');
var EventEmitter = require('events').EventEmitter;

describe('Monitor', function() {
  beforeEach(function (done) {
    dogstatsd.stubAll();
    done();
  });

  afterEach(function (done) {
    dogstatsd.restoreAll();
    done();
  });

  describe('aliases', function () {
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
});
