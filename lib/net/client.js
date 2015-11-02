'use strict';

const EventEmitter = require('events');
const irc          = require('irc');
const log4js       = require('log4js');
const logger       = log4js.getLogger('Net.Client');

module.exports = class extends EventEmitter {
  constructor(netConfig, nick) {
    super();

    this.netConfig = netConfig;
    this.channel = netConfig.ui_channel;
    if(this.channel[0] !== '#') {
      this.channel = '#' + this.channel;
    }
    const opt = {
      server      : netConfig.host,
      port        : netConfig.port,
      autoRejoign : true,
      channels    : [this.channel],
      nick        : nick,
      userName    : nick,
      realName    : 'Mylife Home UI'
    };
    this.irc = new irc.Client(null, null, opt);

    this.irc.on('error',    message => logger.error('IRC error: ' + JSON.stringify(message)));
    this.irc.on('netError', message => logger.error('Network error: ' + JSON.stringify(message)));
  }

  close(callback) {
    this.irc.disconnect('Closing', callback);
    this.irc = null;
  }

  action(id, name, args) {
    args = args || [];
    this.irc.say(this.channel, id + ' ' + name + ' ' + args.join(' '));
  }
};
