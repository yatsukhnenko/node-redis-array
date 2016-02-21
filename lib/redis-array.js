'use strict';
var Int64 = require('int64-native'),
    EventEmitter = require('events'),
    commands = require('redis-commands'),
    crc = require('crc'),
    redis = require('redis'),
    util = require('util');

module.exports = (function() {
    function RedisArray(params) {
        var clients = {},
            hosts = [],
            self = this;
        EventEmitter.call(this);
        params.forEach(function(cfg) {
            var address = cfg.host + ':' + cfg.port;
            if (!clients.hasOwnProperty(address)) {
                hosts.push(address);
                clients[address] = redis.createClient(cfg.port, cfg.host).on('error', function(e) {
                    self.emit('error', e, this);
                });
            }
        });
        this._hosts = function() {
            return hosts;
        };
        this._instance = function(host) {
            return clients[host];
        };
        this._target = function(key) {
            var hash = crc.crc32(key.replace(/^{([^}]+)}.*/, '$1')),
                int64 = new Int64(hash),
                i = (int64.toUnsignedDecimalString() * hosts.length / 0xffffffff) >>> 32;
            return hosts[i];
        };
    }
    util.inherits(RedisArray, EventEmitter);
    RedisArray.prototype.keys = function(pattern, callback) {
        var data = {},
            hosts = this._hosts(),
            self = this;
        hosts.forEach(function(host) {
            self._instance(host).keys(pattern, function(e, reply) {
                data[host] = e || reply;
                if (Object.keys(data).length === hosts.length) { callback(data); }
            });
        });
    };
    commands.list.forEach(function(command) {
        if (!RedisArray.prototype.hasOwnProperty(command)) {
            RedisArray.prototype[command] = function() {
                var client = this._instance(this._target.apply(this, arguments));
                client[command].apply(client, arguments);
            };
        }
    });
    return RedisArray;
})();
