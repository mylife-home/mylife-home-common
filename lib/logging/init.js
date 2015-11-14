'use strict';

const log4js    = require('log4js');
const appenders = require('./appenders');

function init(config) {
  // use default console log
  log4js.addAppender(appenders.irc.appender({ net: config.net }));
}

module.exports = init;