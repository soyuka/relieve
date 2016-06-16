'use strict'

const replicas = [
  'on', 'once', 'addListener', 'removeListener', 'off', 'removeAllListeners'
]

/**
 * Mimics the EventEmitter2 methods and replicates them through custom middlewares
 * it is used to listen on multiple event emitters (tasks) instead of the main one (worker)
 * @param {Function} Fn The prototype where name will be added
 * @param {Function} middleware The propagation mechanism
 */
function listenersPropagation(Fn, middleware) {
  for(let i in replicas) {
    Fn.prototype[replicas[i]] = middleware(replicas[i])
  }
}

module.exports = listenersPropagation
