const master = require('./master')
const CONTAINER = `${__dirname}/container.js`
const constants = require('./constants')
const debug = require('debug')('relieve-failsafe:interface')
const fork = require('child_process').fork

function FailSafe(options) {
  if (!(this instanceof FailSafe)) {
    return new FailSafe(options)
  }

  this.options = constants(options)
}

FailSafe.prototype.attach = function(task) {
  task._createFork = (...args) => {
    return this.createFork.apply(this, args)
  }

  let oldKill = task.kill

  task.kill = (signal) => {
    return new Promise((resolve, reject) => {
      task.channel.once('exit', () => {
        resolve()
      })

      task.channel.send('$TCPEE_KILL', signal === undefined ? 'SIGTERM' : signal)
    })
  }

  this.task = task
  this.options.eventemitter = task.options.eventemitter
  this.task.options.containerArgs.socket = this.options.SOCKET
  this.task.options.container = CONTAINER
  this.task.options.childprocess.detached = true
}

FailSafe.prototype.createFork = function(args) {
  return master(this.options)
  .then(tcpeegroup => {
    let tcpee = tcpeegroup.get(this.task.script)

    if (tcpee === undefined) {
      debug('Forking %s %s', this.task.options.container, this.task.script)
			this.task._fork = fork(this.task.options.container, args, this.task.options.childprocess)

      return new Promise((resolve, reject) => {
        tcpeegroup.once('add', function(tcpee) {
          resolve(tcpee)
        })
      })
    }

    return new Promise((resolve, reject) => {
      tcpee.send('startedAt')
      tcpee.once('startedAt', function(startedAt) {
        tcpee.startedAt = startedAt
        resolve(tcpee)
      })
    })
  })
}

module.exports = FailSafe
