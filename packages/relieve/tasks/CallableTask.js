'use strict'
const ScriptTask = require('./ScriptTask.js')
const p = require('path')
const uuid = require('uuid')
const util = require('util')

/**
 * A Callable Script Task
 * @module tasks/CallableTask
 */

/**
 * @contant {String} Container path
 * @see module:containers/CallableContainer
 */
const CONTAINER = p.resolve(__dirname, '../containers/CallableContainer.js')

/**
 * CallableTask interact with the forked script
 * @extends module:tasks/ScriptTask~ScriptTask
 * @class
 * @inheritdoc
 */
function CallableTask(script, options) {
  if(!(this instanceof CallableTask)) { return new CallableTask(script, options)}

  if(!options)
    options = {}

  options.containers = [CONTAINER].concat(options.containers || [])

  ScriptTask.call(this, script, options)
}

util.inherits(CallableTask, ScriptTask)

/**
 * Call a script method without expecting an answer
 * @param {Mixed} ...arguments
 * @return Promise resolve when message has reach destination
 */
CallableTask.prototype.call = function(...args) {
  args.unshift('call')

  return new Promise((resolve, reject) => {
    args.push(resolve)
    this.channel.send.apply(this.channel, args)
  })
}

/**
 * Get a script property, expecting an answer.
 *
 * The {@link module:containers/CallableContainer Callable Container} is handling functions, promises
 * and simple getters
 * @param {Mixed} ...arguments
 * @return {Promise<...data>} resolves on answer
 */
CallableTask.prototype.get = function(...args) {
  let uniqueCallback = uuid.v4()
  args.unshift(uniqueCallback)
  args.unshift('get')

  return new Promise((resolve, reject) => {
    this.channel.once(uniqueCallback, resolve)
    this.channel.send.apply(this.channel, args)
  })
}

module.exports = CallableTask
