const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const WritableStream = require('stream').Writable
const rotate = require('./rotate.js')
const moment = require('moment')

function Logger(out, err, options = {}) {
  this.out = out
  this.err = err
  this.options = {
    delay: options.delay || null,
    size: options.size || 0
  }
}

Logger.prototype.attach = function(task) {
  this.oldStart = task.start
  task.start = (...args) => {
    return this.start.apply(this, args)
  }

  this.task = task
}

Logger.prototype.start = function(...args) {
  return Promise.all([this.getStream(this.out), this.getStream(this.err)])
  .then((streams) => {
    this.streams = streams.map(s => {
      if (s instanceof WritableStream) {
        return s
      }

      return null
    })

    this.task.options.childprocess.stdio = [this.streams[0], this.streams[1], null, 'ipc']

    return this.oldStart.apply(this.task, args)
  })
}

Logger.prototype.rotate = function(stat) {
  let delay = this.options.delay ? this.options.delay.match(/(\d+)([a-z]+)/i) : null
  let ctime = moment(stat.ctime)

  if (delay && moment().isAfter(ctime.add(delay[1], delay[2]))) {
    return Promise.resolve(true)
  }

  if (this.options.size > 0 && stat.size > this.options.size) {
    return Promise.resolve(true)
  }

  return Promise.resolve(false)
}

Logger.prototype.getStream = function(something) {
  if (!something) {
    return null
  }

  if (something instanceof WritableStream) {
    return Promise.resolve(something)
  }

  if (typeof something !== 'string') {
    throw new TypeError('Log must be either string or WritableStream')
  }

  return fs.statAsync(something)
  .then((stat) => {
    return this.rotate(stat)
    .then((doRotate) => {
      return doRotate ? rotate(something) : Promise.resolve()
    })
    .then(() => {
      return new Promise((resolve) => {
        let stream = fs.createWriteStream(something, {'flags': 'a'})

        stream.on('open', function() {
          resolve(stream)
        })
      })
    })
  })
  .catch(e => {
    if (e.code === 'ENOENT') {
      return new Promise((resolve) => {
        let stream = fs.createWriteStream(something)

        stream.on('open', function() {
          resolve(stream)
        })
      })
    }

    return Promise.reject(e)
  })
}

module.exports = Logger
