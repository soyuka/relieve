'use strict'
const util = require('util')
const Worker = require('./Worker.js')
const Promise = require('bluebird')
const debug = require('debug')('relieve:seriesworker')

/**
 * A Queue Worker that process ending tasks in concurrency
 * @module workers/QueueWorker
 */

/**
 * @class
 * @extends module:workers/Worker~Worker
 * @property {Number} [concurrency=1] The concurrency value
 */
function QueueWorker(options) {
  if(!(this instanceof QueueWorker)) { return new QueueWorker(options) }

  if(!options)
    options = {}

  Worker.call(this, options)

  if(!options.concurrency)
    options.concurrency = 1

  this.options = options
}

util.inherits(QueueWorker, Worker)

/**
 * @throws {TypeError} if task has no start method
 */
QueueWorker.prototype.add = function(task) {
  if(!task.start)
    throw new TypeError('Task must be an instance of ScriptTask or CallableTask')

  Worker.prototype.add.call(this, task)
  return this
}

Object.defineProperty(QueueWorker.prototype, 'concurrency', {
  get: function getConcurrency() {
    return this.options.concurrency
  },
  set: function setConcurrency(val) {
    this.options.concurrency = val
  }
})

/**
 * Runs tasks in the stack
 * Tasks must exit to fullfil the promise, they run in concurrency
 * @see options.concurrency
 * @param Task ...tasks if none provided the whole stack will run
 * @return Promise resolves when every task exited
 */
QueueWorker.prototype.run = function(...args) {
  let stack = []

  if(args.length === 0)
    stack = this.tasks.values()
  else {
    for(let i in args) {
      stack.push(this.tasks.get(args[i]))
    }
  }

  return Promise.all(stack).map(function(e) {
    return e.start()
    .then(() => {
      return new Promise((resolve, reject) => {
        debug('start task %s', e.name);
        e.once('exit', function(code) {
          debug('exit task %s', e.name);
          resolve(code)
        })
      })
    })
  }, {
    concurrency: this.options.concurrency
  })
}

module.exports = QueueWorker
