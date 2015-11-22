'use strict';
var ScriptTask = require('./ScriptTask.js')
var p = require('path')
var uuid = require('uuid')
var util = require('util')

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

  ScriptTask.call(this, script, util._extend({container: CONTAINER}, options))
}

util.inherits(CallableTask, ScriptTask)

/**
 * Call a script method without expecting an answer
 * @param {String} method
 * @param {Mixed} ...arguments 
 * @return Promise resolve when message has reach destination
 */
CallableTask.prototype.call = function(/*method, arguments*/) {
  let args = [].slice.call(arguments)
  args.unshift('call')

  let self = this
  return new Promise(function(resolve, reject) {
    args.push(resolve)
    self.channel.send.apply(self.channel, args)
  })
}

/**
 * Get a script property, expecting an answer.
 *
 * The {@link module:containers/CallableContainer Callable Container} is handling functions, promises
 * and simple getters
 * @param {String} method
 * @param {Mixed} ...arguments
 * @return {Promise<...data>} resolves on answer
 */
CallableTask.prototype.get = function(/*method, arguments*/) {
  let args = [].slice.call(arguments)
  let uniqueCallback = uuid.v4()
  args.unshift(uniqueCallback)
  args.unshift('get')

  let self = this

  return new Promise(function(resolve, reject) {
    self.channel.once(uniqueCallback, resolve)

    self.channel.send.apply(self.channel, args)
  })
}

module.exports = CallableTask
