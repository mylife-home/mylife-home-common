'use strict';

const os      = require('os');
const async   = require('async');
const layouts = require('log4js').layouts;
const net     = require('../../net');

let client;

function appender(config, layout, timezoneOffset) {
  layout = layout || layouts.basicLayout;

  if(!client) {
    const netConfig = config.net;
    const nick = os.hostname().split('.')[0] + '_' + process.pid;
    client = new net.Client(netConfig, nick, [netConfig.log_channel], undefined, true);
  }

  return function(loggingEvent) {
    const text = layout(loggingEvent, timezoneOffset);
    client.say(text);
  };
}

function configure(config) {
  var layout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return appender(config, layout, config.timezoneOffset);
}

function shutdown(cb) {
  if(!client) { return setImmediate(cb); }
  client.close(cb);
  client = undefined;
}

exports.name      = 'irc';
exports.appender  = appender;
exports.configure = configure;
exports.shutdown  = shutdown;
