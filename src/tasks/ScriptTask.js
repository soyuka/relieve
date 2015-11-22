'use strict';
var child_process = require('child_process')
var Promise = require('bluebird')
var IPCEE = require('ipcee')
var p = require('path')
var util = require('util')
var defineNameProperty = require('../utils/defineNameProperty.js')
var listenersPropagation = require('../utils/listenersPropagation.js')
var debug = require('debug')('relieve:scripttask')
var EventEmitter = require('eventemitter2').EventEmitter2

/**
 * A Script Task
 * @module tasks/ScriptTask
 */

/**
 * @contant {String} Container path
 * @see module:containers/ScriptContainer
 */
const CONTAINER = p.resolve(__dirname, '../containers/ScriptContainer.js')

/**
 * ScriptTask takes a module path and runs it in a container
 * @class
 * @extends IPCEE 
 * @see {@link https://github.com/soyuka/IPCEE}
 * @see {@link https://nodejs.org/api/child_process.html}
 * @param {String} script the path of the script
 * @param {Object} options 
 * @property {ChildProcess} channel the ipcee channel
 * @property {String} [name=uuid.v4] the task name
 * @property {Object} options Task options
 * @property {Boolean} options.restart Restart when exit
 * @property {Number} options.restartDelay Delay before restart
 * @property {String} options.container The Container path that holds the Task
 * @property {Object} options.eventemitter Eventemitter2 options
 * @property {Object} options.childprocess childprocess.Fork options
 * @property {Boolean} running the ipcee channel
 */
function ScriptTask(script, options) {

  if(!(this instanceof ScriptTask)) { return new ScriptTask(script, options) }

  if(!options)
    options = {}

  if(typeof script !== 'string')
    throw new TypeError('Script must be a string!')

  this.script = script

  this.options = {
    restart: options.restart || false, 
    restartDelay: options.restartDelay || 0,
    container: options.container || CONTAINER,
    eventemitter: options.eventemitter || {wildcard: false},
    childprocess: options.childprocess || {}
  }

  this.running = false
  this.events = []
  this.arguments = []
}

defineNameProperty(ScriptTask)

/**
 * @event module:tasks/ScriptTask~ScriptTask#exit
 * @property {Number} code
 */

/**
 * Exit event listener
 * @param {Number} code the exit code
 * @listens module:tasks/ScriptTask~ScriptTask#exit
 */
ScriptTask.prototype.onExit = function(code) {
  this.running = false
  this.events = []

  if(this.options.restart === false) {
    return;
  }

  this.restart()
}

/**
 * Error event listener
 * @param {String} error message
 * @param {String} stack stack trace
 * @listens module:tasks/ScriptTask~ScriptTask#error
 */
ScriptTask.prototype.onError = function(message, stack) {
  console.error('Error caught on %s', this.name)
  console.error(stack)
}

/**
 * Start the Task
 * @param {Arguments} args Arguments for the child_process
 * @throws {ReferenceError} if already running
 * @listens exit
 * @return {Promise} resolve when Task emits start
 */
ScriptTask.prototype.start = function(/** args **/) {
  if(this.running === true) {
    return Promise.reject(new ReferenceError('Already running'))
  }

  let args = [].slice.call(arguments)

  if(args.length === 0)
    args = this.arguments

  args = args.map(e => JSON.stringify(e))

  //adds the script in first position
  args.unshift(this.script)
  //adds the event emitter options in last position
  args.push(JSON.stringify(this.options.eventemitter))

  debug('Forking %s with args %o', this.script, args)

  this._fork = child_process.fork(this.options.container, args, this.options.childprocess) 

  this.channel = new IPCEE(this._fork, this.options.eventemitter)

  this.channel.on('error', this.onError.bind(this))
  this.channel.once('exit', this.onExit.bind(this))

  for(let i in this.events) {
    let e = this.events[i]
    debug('Registering event', e)
    this.channel[e.method].apply(this.channel, e.args)
  }

  let self = this

  return new Promise(function(resolve, reject) {
    self.running = true
    self.channel.once('start', resolve)   
  })
}

/**
 * Restart the Task
 * @return {Promise} resolves when restarted
 */
ScriptTask.prototype.restart = function() {
  if(this.running === true) {
    this.kill()
    this.running = false
  }

  this.channel.emit('restart')

  return Promise.delay(this.options.restartDelay).then(() => this.start())
}

/**
 * Fake event emitter, call events left in the stack
 * @param {String} event 
 * @param {Array} args
 * @private
 */
ScriptTask.prototype._fakeEmit = function(event, args) {
  let remove = []

  for(let i in this.events) {
    let e = this.events[i]

    if(e.args[0] == event) {
      e.args[1].apply(this, args) 

      if(~['once'].indexOf(e.method))  {
        remove.push(i)  
      }
    }
  }

  for(let i in remove)
    this.events.splice(remove[i], 1)
}

/**
 * Kill sends a signal to the Task
 * @param {Number} signal
 * @see ChildProcess#signal
 */
ScriptTask.prototype.kill = function(signal) {
  if(!this.channel) {
    return this._fakeEmit('exit', [-1])
  }

  let client = this.channel.client
  return client.kill.call(client, signal)
}

/**
 * Childprocess.send wrapper
 * @throws {ReferenceError}
 * @param {String} event
 * @param {Arguments} ...args
 * @return Promise
 */
ScriptTask.prototype.send = function(/** event, args **/) {
  if(!this.channel) {
    throw new ReferenceError('The task is not running') 
  }

  let args = [].slice.call(arguments)
  let channel = this.channel
  let self = this

  return new Promise(function(resolve, reject) {
    args.push(function() {
      return resolve(self) 
    })

    channel.send.apply(channel, args)
  })
}

/**
 * Mimic the IPCEE methods, register events on every task
 */
listenersPropagation(ScriptTask, function replicateListener(method) {
  return function() {
    let args = [].slice.call(arguments)

    if(!this.channel) { 
      debug('No channel, keep event', {method: method, args: args})
      this.events.push({method: method, args: args})
    } else {
      this.channel[method].apply(this.channel, args)
    }
  }
})

module.exports = ScriptTask
