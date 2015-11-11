# node-redis-array

Basic implementation of RedisArray for nodejs compatible with [phpredis](https://github.com/phpredis/phpredis/blob/master/arrays.markdown)

Install with: `npm install redis-array`

## Creating an array

<pre>
var RedisArray = require('redis-array');
var ra = new RedisArray([{ host: "host1", port: 6379 }, { host: "host2", port: 6379 }]);
</pre>

## Key hashing
By default node-redis-array will try to find a substring enclosed in curly braces within the key name, and use it to distribute the data.

For instance, the keys "{user:1}:name" and "{user:1}:email" will be stored on the same server as only "user:1" will be hashed.

## Usage

Redis arrays can be used just as Redis objects:
<pre>
ra.set("user1:name", "Joe", function(e, reply) {
  // do somethig
});
ra.get("user2:name", "Mike", function(e, reply) {
  // do something
});
</pre>
Running KEYS() on a RedisArray object will execute the command on each node and return an associative array of keys, indexed by host name.

## Array info
RedisArray objects provide several methods to help understand the state of the cluster. These methods start with an underscore.

* `ra._hosts()` → returns a list of hosts for the selected array.
* `ra._target(key)` → returns the host to be used for a certain key.
* `ra._instance(host)` → returns a redis instance connected to a specific node; use with `_target` to get a single Redis object.
