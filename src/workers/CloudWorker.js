'use strict';
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
CloudWorker.prototype.send = function() {
  let args = [].slice.call(arguments)
  let self = this
  return this.strategy.next()
  .then(function(name) {
    let task = self.tasks.get(name)
    return task.send.apply(task, args)
  })
}

function getOrCallNext(method) {
  return function() {
    let args = [].slice.call(arguments)
    let self = this

    return this.strategy.next()
    .then(function(name) {
      let task = self.task(name)

      if(!(method in task))
        return Promise.reject(new ReferenceError(`The task has no '${method}' method`))

      return self.strategy.start(name)
      .then(function() {
        return task[method].apply(task, args)
      })
      .then(function() {
        let args = [].slice.call(arguments)
        return self.strategy.end(task.name)
        .then(function() {
          return Promise.resolve.apply(Promise, args)
        })
      })
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
   let s = task.start()
   .then(e => this.strategy.push(task.name))

   stack.push(s) 
  }

  return Promise.all(stack)
}

module.exports = CloudWorker
