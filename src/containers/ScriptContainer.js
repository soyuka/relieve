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

const ipc = IPCEE(process, args.pop())

let script = require(args[0])

if(typeof script == 'function')
  script = new script

if(typeof script == 'object' && typeof script.setChannel == 'function') {
  script.setChannel(ipc)
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

module.exports = {script, ipc}
