'use strict';
var assert = require('assert')
var p = require('path')

/**
 * Callable script container
 * @module containers/CallableContainer
 */

/**
 * @contant {String} SCRIPT_OBJECT_ERROR
 */
const SCRIPT_OBJECT_ERROR = 'Script is not an object'

var container = require('./ScriptContainer.js')
var script = container.script
var ipc = container.ipc

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
 * @param {arguments} ...data
 * @example
 * ipc.send('call', 'method', args...)
 */
var call = function(/*method, ...data*/) {
  let args = [].slice.call(arguments)
  let method = args.shift()

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
 * @param {arguments} ...data
 * @example
 * ipc.send('get', 'uniqueid-event', 'info')
 */
var get = function(/*key, ...data*/) {
  let args = [].slice.call(arguments)
  let uid = args.shift()
  let method = args.shift()

  if(typeof script != 'object')
    return error(new Error(SCRIPT_OBJECT_ERROR))

  if(typeof script[method] == 'function') {
    return Promise.resolve(script[method].apply(script, args))
    .then(function() {
      let args = [].slice.call(arguments)
      args.unshift(uid)

      ipc.send.apply(ipc, args)
    })
  }

  ipc.send.apply(ipc, [uid, script[method]])
}

ipc.on('get', get)
