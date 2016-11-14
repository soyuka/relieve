'use strict';
const fork = require('child_process').fork
const Promise = require('bluebird')
const IPCEE = require('ipcee')
const p = require('path')
const util = require('util')
const defineNameProperty = require('../utils/defineNameProperty.js')
const listenersPropagation = require('../utils/listenersPropagation.js')
const debug = require('debug')('relieve:scripttask')
const EventEmitter = require('eventemitter2').EventEmitter2

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
 * @property {String} options.container Base Container
 * @property {Array} options.containers An array of additional containers
 * @property {Object} options.eventemitter Eventemitter2 options
 * @property {Object} options.childprocess childprocess.Fork options
 * @property {Object} options.interfaces Javascript prototype which grasp on the Task prototye
 * @property {[]} running the ipcee channel
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
    containers: options.containers || [],
    containerArgs: {},
    container: options.container || CONTAINER,
    eventemitter: options.eventemitter || {wildcard: false},
    childprocess: options.childprocess || {},
    interfaces: options.interfaces || []
  }

  this.running = false
  this.events = []
  this.arguments = []
  this.startedAt = 0
  this.restarts = -1
  this._nameGenerated = true

  this.options.interfaces.length && this.options.interfaces.map(i => {
    if (typeof i.attach !== 'function') {
      console.error('Interface should have an attach method')
      return
    }

    i.attach(this)
  })
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

  if(this.shouldRestart === false) {
    return
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

ScriptTask.prototype._createFork = function(args) {
  debug('Forking %s with args %o and options %j', this.script, args)
  this._fork = fork(this.options.container, args, this.options.childprocess)
  return Promise.resolve(new IPCEE(this._fork, this.options.eventemitter))
}

/**
 * Start the Task
 * @param {Arguments} args Arguments for the child_process
 * @throws {ReferenceError} if already running
 * @listens exit
 * @return {Promise} resolve when Task emits start
 */
ScriptTask.prototype.start = function(...args) {
  if(this.running === true) {
    return Promise.reject(new ReferenceError('Already running'))
  }

  this.shouldRestart = this.options.restart

  if(args.length === 0)
    args = this.arguments

  args = args.map(e => JSON.stringify(e))

  //adds the script in first position
  args.unshift(this.script)
  //adds the event emitter options in last position
  let containerArgs = this.options.containerArgs
  containerArgs.eventemitter = this.options.eventemitter
  containerArgs.containers = this.options.containers
  this.identity = containerArgs.identity = this._nameGenerated === false ? this.name : this.script

  args.push(JSON.stringify(containerArgs))

  return this._createFork(args)
  .then((channel) => {
    return new Promise((resolve, reject) => {
      this.channel = channel
      this.channel.on('error', this.onError.bind(this))
      this.channel.once('exit', this.onExit.bind(this))

      for(let i in this.events) {
        let e = this.events[i]
        debug('Registering event', e)
        this.channel[e.method].apply(this.channel, e.args)
      }

      this.running = true

      this.channel.send('$RELIEVE_REQUIRE')

      if (channel.startedAt !== undefined) {
        this.startedAt = channel.startedAt
        this.restarts++
        return resolve()
      }

      this.channel.once('start', (startedAt) => {
        this.startedAt = startedAt
        this.restarts++
        resolve()
      })
    })
  })
}

/**
 * Restart the Task
 * @return {Promise} resolves when restarted
 */
ScriptTask.prototype.restart = function() {
  let restart = () => {
    this.channel.emit('restart')

    return Promise.delay(this.options.restartDelay).then(() => {
      this.shouldRestart = true
      return this.start()
    })
  }

  if(this.running === true) {
    return this.stop()
    .then(restart)
  } else {
    return restart()
  }
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

ScriptTask.prototype.stop = function() {
  if (this.shouldRestart) {
    this.shouldRestart = false
  }

  return this.kill()
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

  return new Promise((resolve, reject) => {
    this.channel.once('exit', () => resolve())

    client.kill.call(client, signal)
  })
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

  return new Promise((resolve, reject) => {
    args.push(() => {
      return resolve(this)
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
