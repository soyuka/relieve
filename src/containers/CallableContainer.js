'use strict'
const assert = require('assert')
const p = require('path')

/**
 * Callable script container
 * @module containers/CallableContainer
 */

/**
 * @contant {String} SCRIPT_OBJECT_ERROR
 */
const SCRIPT_OBJECT_ERROR = 'Script is not an object'

if (!process.relieve) {
  require('./ScriptContainer.js')
}

const script = process.relieve.script
const ipc = process.relieve.ipc

/**
 * Adds a stack trace to the error event
 * @param {Error} error
 * @private
 */
function error(error) {
  return ipc.send('error', error.message, error.stack)
}

/**
 * Is used for long jobs, don't expect an answer
 * @param {String} method method
 * @param {arguments} ...args
 * @example
 * ipc.send('call', 'method', args...)
 */
function call(method, ...args) {
  if(typeof script != 'object')
    return error(new Error(SCRIPT_OBJECT_ERROR))

  if(typeof script[method] != 'function')
    return error(new Error(`Method ${method} is not a function`))

  script[method].apply(script, args)
}

ipc.on('call', call)

/**
 * Like Call but we send data back
 * The parent process listens on the uniqueid-event
 * @param {String} key key
 * @param {String} method key
 * @param {arguments} ...args
 * @example
 * ipc.send('get', 'uniqueid-event', 'info')
 */
function get(key, method, ...args) {
  if(typeof script != 'object')
    return error(new Error(SCRIPT_OBJECT_ERROR))

  if(typeof script[method] == 'function') {
    return Promise.resolve(script[method].apply(script, args))
    .then((...args) => {
      args.unshift(key)

      ipc.send.apply(ipc, args)
    })
  }

  ipc.send.apply(ipc, [key, script[method]])
}

ipc.on('get', get)
