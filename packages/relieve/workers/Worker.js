'use strict'
const readOnly = require('../utils/readOnly.js')
const listenersPropagation = require('../utils/listenersPropagation.js')
const uuid = require('uuid')
const util = require('util')
const EventEmitter = require('eventemitter2').EventEmitter2
const debug = require('debug')('relieve:worker')

/**
 * A basic Worker
 * @module workers/Worker
 */

/**
 * Creates a Worker
 * @class
 * @param {Object} Options
 */
function Worker(options) {
  if(!(this instanceof Worker)) { return new Worker(options) }
  if(!options) { options = {} }
  this._tasks = new Map()
}

/**
 * send a message on every task
 * @return {Promise} resolves when every task received the message
 */
Worker.prototype.send = function(...args) {
  let stack = []

  for(let task of this._tasks.values()) {
    stack.push(new Promise((resolve, reject) => {
      let a = args.slice(0) //clone arguments
      a.push(resolve) //adds the resolve callback
      task.send.apply(task, a)
    }))
  }

  return Promise.all(stack)
}

/**
 * Registers an exit listener
 * @param {String} name the task name
 * @return {Function} The listener that deletes an ended task
 */
Worker.prototype.onExit = function(name) {
  const self = this
  return function(code) {
    debug('Task %s exit with code %d', name, code)
    self._tasks.delete(name)
  }
}

/**
 * Add a task to the worker
 * @method
 * @listens Worker.task~event:exit
 * @param {Task} task
 * @return this
 */
Worker.prototype.add = function(task) {
  task.once('exit', this.onExit(task.name))

  this._tasks.set(task.name, task)

  return this
}

/**
 * Removes a worker by name
 * @param {String} name
 * @return {Promise} resolves when the task exit event is fired
 */
Worker.prototype.remove = function(name) {
  return new Promise((resolve, reject) => {
    let task = this.task(name)

    task.once('exit', function() {
      resolve()
    })

    process.nextTick(function() {
      task.kill()
    })
  })
}

/**
 * Get a task by name
 * @param {String} name
 * @return {Task}
 */
Worker.prototype.task = function (name) {
  return this._tasks.get(name)
}

/**
 * Get the tasks Set
 * @return {Set}
 */

readOnly(Worker, 'tasks', function() {
  return this._tasks
})

listenersPropagation(Worker, function replicateListener(method) {
  return function() {
    debug('Register event %s on task', method)
    for(let task of this._tasks.values()) {
      task[method].apply(task, arguments)
    }
  }
})

/**
 * Send a signal to tasks
 * @param {Number} Signal
 * @see ChildProcess#signal
 */
Worker.prototype.kill = function(signal) {
  for(let task of this._tasks.values()) {
    task.kill(signal)
  }
}

/**
 * Starts every tasks
 * @param {Number} Signal
 * @see ChildProcess#signal
 */
Worker.prototype.start = function(...args) {
  let stack = []
  for(let task of this._tasks.values()) {
    stack.push(task.start.apply(task, args))
  }

  return Promise.all(stack)
}

module.exports = Worker
