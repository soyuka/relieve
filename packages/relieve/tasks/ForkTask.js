'use strict'
const IPCEE = require('ipcee')
const util = require('util')
const defineNameProperty = require('../utils/defineNameProperty.js')

/**
 * A basic Fork task
 * @module tasks/ForkTask
 * @tutorial ForkTask
 */

/**
 * @class
 * @param {Childprocess#fork} fork a forked script
 * @property {String} [name=uuid.v4()] the task name
 */
function ForkTask(fork) {
  if(!(this instanceof ForkTask)) { return new ForkTask(fork) }

  IPCEE.call(this, fork, {wildcard: false})
}

util.inherits(ForkTask, IPCEE)
defineNameProperty(ForkTask)

/**
 * Wrapper to child_process.kill(signal)
 * {@link https://nodejs.org/api/process.html#process_process_kill_pid_signal}
 * @param {Number} signal
 * @return void
 */
ForkTask.prototype.kill = function(signal) {
  this.client.kill(signal)
}

module.exports = ForkTask
