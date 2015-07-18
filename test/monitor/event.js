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

describe('Monitor', function() {
  beforeEach(function (done) {
    dogstatsd.stubAll();
    done();
  });

  afterEach(function (done) {
    dogstatsd.restoreAll();
    done();
  });

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
      var expected = '_e{' + title.length + ',' + text.length + '}:' +
        title + '|' + text;
      monitor.event({ title: title, text: text });
      expect(monitor.client.send_data.calledOnce).to.be.true();
      expect(monitor.client.send_data.firstCall.args[0].toString())
        .to.equal(expected);
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
      expect(monitor.client.send_data.calledOnce).to.be.true();
      expect(monitor.client.send_data.firstCall.args[0].toString())
        .to.equal(expected);
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
      expect(monitor.client.send_data.calledOnce).to.be.true();
      expect(monitor.client.send_data.firstCall.args[0].toString())
        .to.equal(expected);
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
      expect(monitor.client.send_data.calledOnce).to.be.true();
      expect(monitor.client.send_data.firstCall.args[0].toString())
        .to.equal(expected);
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
      expect(monitor.client.send_data.calledOnce).to.be.true();
      expect(monitor.client.send_data.firstCall.args[0].toString())
        .to.equal(expected);
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
      expect(monitor.client.send_data.calledOnce).to.be.true();
      expect(monitor.client.send_data.firstCall.args[0].toString())
        .to.equal(expected);
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
      expect(monitor.client.send_data.calledOnce).to.be.true();
      expect(monitor.client.send_data.firstCall.args[0].toString())
        .to.equal(expected);
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
        expect(monitor.client.send_data.lastCall.args[0].toString())
          .to.equal(expected);
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
      expect(monitor.client.send_data.calledOnce).to.be.true();
      expect(monitor.client.send_data.firstCall.args[0].toString())
        .to.equal(expected);
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
      expect(monitor.client.send_data.calledOnce).to.be.true();
      expect(monitor.client.send_data.firstCall.args[0].toString())
        .to.equal(expected);
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
        expect(monitor.client.send_data.lastCall.args[0].toString())
          .to.equal(expected);
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
      expect(monitor.client.send_data.calledOnce).to.be.true();
      expect(monitor.client.send_data.firstCall.args[0].toString())
        .to.equal(expected);
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
      expect(monitor.client.send_data.calledOnce).to.be.true();
      expect(monitor.client.send_data.firstCall.args[0].toString())
        .to.equal(expected);
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
      expect(monitor.client.send_data.calledOnce).to.be.true();
      expect(monitor.client.send_data.firstCall.args[0].toString())
        .to.equal(expected);
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
      expect(monitor.client.send_data.calledOnce).to.be.true();
      expect(monitor.client.send_data.firstCall.args[0].toString())
        .to.equal(expected);
      done();
    });
  }); // end 'event'
}); // end 'monitor'
