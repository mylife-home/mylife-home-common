'use strict';

const irc          = require('irc');
const log4js       = require('log4js');
const logger       = log4js.getLogger('Net.Admin');

class Client {
  constructor(netConfig, nick, definition) {
    let channel = netConfig.admin_channel;
    if(channel[0] !== '#') {
      channel = '#' + channel;
    }
    const opt = {
      server      : netConfig.host,
      port        : netConfig.port,
      autoRejoign : true,
      channels    : [channel],
      nick        : nick,
      userName    : nick,
      realName    : 'Mylife Home UI'
    };
    this._irc = new irc.Client(null, null, opt);
    this._channel = channel;
    this._definition = definition;

    this._irc.on('error',    message => logger.error('IRC error: ' + JSON.stringify(message)));
    this._irc.on('netError', message => logger.error('Network error: ' + JSON.stringify(message)));

    const self = this;
    this._irc.on('message', self._message.bind(self));

    if(!this._definition.help) {
      this._definition.help = {
        desc : 'Get this help message',
        impl : this._help.bind(this)
      };
    }
  }

  close(callback) {
    this._irc.disconnect('Closing', callback);
    this._irc = null;
  }

  _message(from, to, text) {
    if(to !== this._irc.nick) { return; } // ignore chan msg
    const writer = this._irc.notice.bind(this._irc, from);
    this._execute(this._definition, text, writer);
  }

  _nextToken(message) {
    const arr = message.split(' ');
    return {
      token   : arr.shift(),
      message : arr.join(' ')
    };
  }

  _execute(definition, message, writer) {
    const tokens = this._nextToken(message);
    const cmd    = tokens.token.toLowerCase();
    const args   = tokens.message;
    const key    = Object.keys(definition).find(n => n.toLowerCase() === cmd);

    if(!key) { logger.info('key ' + cmd + ' not found: ' + message); return; }
    const child = definition[key];
    if(child.impl) {
      child.impl(writer, args);
      return;
    }

    const subDefinition = child.children;
    if(subDefinition) {
      this._execute(subDefinition, args, writer);
      return;
    }
  }

  _help(writer) {
    this._helpNode(writer, 0, this._definition);
  }

  _helpNode(writer, indent, node) {
    const childWriter = this._helpNode.bind(this, writer, indent + 1);
    for(let name of Object.keys(node)) {
      const item = node[name];
      writer(' '.repeat(indent * 2) + irc.colors.wrap('bold', name.toUpperCase()) + ': ' + item.desc);
      const children = item.children;
      if(children) {
        childWriter(children);
      }
    }
  }
}

module.exports = Client;