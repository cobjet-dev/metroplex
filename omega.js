'use strict';

var async = require('async');

/**
 * Omega supreme integration.
 *
 * @param {Primus} primus Primus instance
 * @api private
 */
module.exports = function forwards(primus) {
  if (!primus.forward) return;

  var metroplex = forward.metroplex
    , forward = primus.forward;

  /**
   * Broadcast a message to every connected server in the cluster.
   *
   * @param {Mixed} msg Message to broadcast.
   * @param {Function} fn Completion callback.
   * @returns {Forward}
   * @api public
   */
  forward.broadcast = function broadcast(msg, fn) {
    metroplex.servers(function servers(err, list) {
      if (err) return fn(err);

      async.each(list, function each(server, next) {
        forward(server, msg, next);
      }, fn);
    });

    return forward;
  };

  /**
   * Broadcast a message to a range of users in the cluster.
   *
   * @param {Array} ids The ids that need to be resolved.
   * @param {Mixed} msg Message to broadcast.
   * @param {Function} fn Completion callback.
   * @returns {Forward}
   * @api public
   */
  forward.sparks = function sparks(ids, msg, fn) {
    metroplex.sparks(ids, function sparks(err, servers) {
      if (err) return fn(err);

      servers = Object.keys(servers).reduce(function fn(memo, spark) {
        var address = servers[spark];

        memo[address] = memo[address] || [];
        memo[address].push(spark);

        return memo;
      }, {});

      async.each(Object.keys(servers), function each(server, next) {
        forward(server, msg, servers[server], next);
      }, fn);
    });

    return forward;
  };

  /**
   * Forward the message to a specific spark
   *
   * @param {String} id Spark id
   * @param {Mixed} msg Message to broadcast.
   * @param {Function} fn Completion callback.
   * @returns {Forward}
   * @api public
   */
  forward.spark = function spark(id, msg, fn) {
    metroplex.spark(id, function spark(err, server) {
      if (err) return fn(err);

      forward(server, msg, id, fn);
    });

    return forward;
  };
};