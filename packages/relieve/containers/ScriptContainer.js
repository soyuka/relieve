'use strict'
/**
 * Script container
 * @module containers/ScriptContainer
 */

if (!process.relieve || process.relieve.ipc === undefined) {
  require('./IPCContainer')
}

const {argv, containerArgs, ipc} = process.relieve

ipc.once('$RELIEVE_REQUIRE', function() {
  let script = require(argv[0])

  if(typeof script == 'function') {
    script = new script
  }

  process.relieve.script = script

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
  function errorCaught(err) {
    console.error(err.stack)

    /**
    * @fires error
    */
    ipc.send('error', err.toString(), err.stack)

    process.nextTick(() => process.exit(1))
  }

  ;['uncaughtException', 'unhandledRejection'].map(e => process.on(e, errorCaught))

  containerArgs.containers.map(e => require(e))

  const startedAt = Date.now()
  ipc.send('start', startedAt)
})
