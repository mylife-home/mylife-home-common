'use strict';

const log4js    = require('log4js');
const appenders = require('./appenders');

function init(config) {

  const before = log4js.getLogger('before');

  // use default console log
  log4js.addAppender(appenders.irc.appender({ net: config.net }));

  const after = log4js.getLogger('after');

  console.log('before', before.listeners("log"));
  console.log('after', after.listeners("log"));
}

module.exports = init;