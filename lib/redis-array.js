'use strict';
var Int64 = require('int64-native'),
    commands = require('redis/lib/commands'),
    crc = require('crc'),
    redis = require('redis');

module.exports = (function() {
    function RedisArray(params) {
        var hosts = [],
            clients = {};
        params.forEach(function(cfg) {
            var address = cfg.host + ':' + cfg.port;
            if (!clients.hasOwnProperty(address)) {
                hosts.push(address);
                clients[address] = redis.createClient(cfg.port, cfg.host);
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
    commands.forEach(function(command) {
        var commandName = command.split(' ', 2)[0];
        if (!RedisArray.prototype.hasOwnProperty(commandName)) {
            RedisArray.prototype[commandName] = function() {
                var client = this._instance(this._target.apply(this, arguments));
                client[commandName].apply(client, arguments);
            };
        }
    });
    return RedisArray;
})();
