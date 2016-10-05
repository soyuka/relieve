'use strict'
const IPCEE = require('ipcee')

/**
 * Script container
 * @module containers/ScriptContainer
 */

process.argv = process.argv.map(function(e, i) {
  if(i < 3)
    return e

  return JSON.parse(e)
})

let args = [].slice.call(process.argv, 2)

let containerArgs = args.pop()
const ipc = IPCEE(process, containerArgs.eventemitter)

let script = require(args[0])

if(typeof script == 'function') {
  script = new script
}

process.relieve = {script, ipc}

if(typeof script == 'object' && typeof script.setChannel == 'function') {
  console.error('setChannel: deprecated method call, use start instead or access the channel through process.relieve.ipc')
  script.setChannel(ipc)
}

if(typeof script == 'object' && typeof script.start == 'function') {
  script.start()
}

/**
 * @listens module:process#uncaughtException
 */
process.on('uncaughtException', function(err) {
  /**
   * @fires start
   */
  ipc.send('error', err.toString(), err.stack)

  process.nextTick(() => process.exit(1))
})

ipc.send('start')

containerArgs.containers.map(e => require(e))
