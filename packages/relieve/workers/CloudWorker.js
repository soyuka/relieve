'use strict'
var util = require('util')
var Worker = require('./Worker.js')
var Promise = require('bluebird')
var debug = require('debug')('relieve:seriesworker')

const STRATEGY = require('../strategies/WeightedStrategy.js')

/**
 * A Cloud Worker will use the same script and act on each one according to
 * the strategy
 * @module workers/CloudWorker
 */

/**
 * @class
 * @extends module:workers/Worker~Worker
 * @property {Strategy} [strategy=Strategy] The round robin strategy
 */
function CloudWorker(options) {
  if(!(this instanceof CloudWorker)) { return new CloudWorker(options) }

  if(!options)
    options = {}

  Worker.call(this, options)

  this.options = options
  this.strategy = options.strategy || STRATEGY
}

util.inherits(CloudWorker, Worker)

/**
 * @inheritdoc
 */
CloudWorker.prototype.onExit = function(name) {
  return function(code) {
    this.strategy.remove(name)
    return Worker.prototype.onExit.call(this, name)(code)
  }.bind(this)
}

/**
 * @throws TypeError if task has no start method
 */
CloudWorker.prototype.add = function(task) {
  if(!task.start)
    throw new TypeError('Task must be an instance of ScriptTask or CallableTask')

  Worker.prototype.add.call(this, task)
  return this
}

/**
 * Send a message to the next available task
 * @throws {ReferenceError}
 * @param {String} event
 * @param {Arguments} ...args
 * @return Promise
 */
CloudWorker.prototype.send = function(...args) {
  return this.strategy.next()
  .then((name) => {
    let task = this.tasks.get(name)
    return task.send.apply(task, args)
  })
}

function getOrCallNext(method) {
  return function(...args) {
    let task

    return this.strategy.next()
    .then((name) => {
      task = this.task(name)

      if(!(method in task))
        return Promise.reject(new ReferenceError(`The task has no '${method}' method`))

      return this.strategy.start(name)
    })
    .then(() => {
      return task[method].apply(task, args)
    })
    .then((...newArgs) => {
      args = newArgs
      return this.strategy.end(task.name)
    })
    .then(() => {
      return Promise.resolve.apply(Promise, args)
    })
  }
}

/**
 * Call `get` on the next strategy available task
 * @method
 * @see module:tasks/CallableTask~CallableTask#get
 */
CloudWorker.prototype.get = getOrCallNext('get')

/**
 * Call `call` on the next strategy available task
 * @method
 * @see module:tasks/CallableTask~CallableTask#call
 */
CloudWorker.prototype.call = getOrCallNext('call')

/**
 * Start tasks
 * @return Promise resolves when every task is started
 */
CloudWorker.prototype.run = function() {
  let stack = []
  for(let task of this.tasks.values()) {
    if(task.running === true)
      continue;

    let s = task.start()
    .then(e => this.strategy.push(task.name))

   stack.push(s)
  }

  return Promise.all(stack)
}

module.exports = CloudWorker
