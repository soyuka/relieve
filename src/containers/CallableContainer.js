'use strict';
var assert = require('assert')
var IPCEE = require('ipcee')
var p = require('path')

/**
 * Callable script container
 * @module containers/CallableContainer
 */

/**
 * @contant {String} SCRIPT_OBJECT_ERROR
 */
const SCRIPT_OBJECT_ERROR = 'Script is not an object'

process.argv = process.argv.map(function(e, i) {
  if(i < 3)
    return e

  return JSON.parse(e)
})

var args = [].slice.call(process.argv, 2)

var opts = args.pop()

var ipc = IPCEE(process, opts)

var script = require(args[0])

if(typeof script == 'object' && typeof script.setChannel == 'function') {
  script.setChannel(ipc)
}

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
    return error(SCRIPT_OBJECT_ERROR)

  if(typeof script[method] != 'function')
    return error(`Method ${method} is not a function`)

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
    return error(SCRIPT_OBJECT_ERROR)

  if(typeof script[method] == 'function') {
    return Promise.resolve(script[method]())
    .then(function() {
      let args = [].slice.call(arguments)
      args.unshift(uid)

      ipc.send.apply(ipc, args)
    })
  }

  ipc.send.apply(ipc, [uid, script[method]])
}

ipc.on('get', get)

process.on('uncaughtException', function(err) {
  ipc.send('error', err.toString(), err.stack)

  process.nextTick(function() {
    process.exit(1) 
  })
})

ipc.send('start')
