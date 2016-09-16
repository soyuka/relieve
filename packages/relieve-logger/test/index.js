const Logger = require('../')
const moment = require('moment')
const chai = require('chai')
const expect = chai.expect
const fs = require('fs')
const EE = require('eventemitter2')
const fakeTask = {
  start: function() {},
  options: {
    childprocess: {}
  },
  channel: new EE()
}

describe('RelieveLogger', function() {

  it('should create log file and close stream on exit', function(cb) {
    let path = `${__dirname}/fixtures/nonexistant`
    let l = new Logger(path)

    fakeTask.start = function() {
      this.options.childprocess.stdout.write('test')
      process.nextTick(function() {
        fakeTask.channel.emit('exit')
      })

      return Promise.resolve()
    }

    l.attach(fakeTask)

    fakeTask.start()
    .then(() => {
      fakeTask.options.childprocess.stdout.on('close', function() {
        cb()
      })
    })
  })

  it('should append to log file', function(cb) {
    let path = `${__dirname}/fixtures/nonexistant`
    let l = new Logger(path)

    fakeTask.start = function() {
      this.options.childprocess.stdout.write('test')
      process.nextTick(function() {
        fakeTask.channel.emit('exit')
      })

      return Promise.resolve()
    }

    l.attach(fakeTask)

    fakeTask.start()
    .then(() => {
      fakeTask.options.childprocess.stdout.on('close', function() {
        let d = fs.readFileSync(path)
        expect(d.toString()).to.equal('testtest')
        fs.unlink(path, cb)
      })
    })
  })

  it('should rotate delay', function() {
    let l = new Logger('one', 'two', {
      delay: '1d'
    })

    let ctime = moment().subtract(2, 'days')

    return l.rotate({ctime: ctime, size: 0})
      .then(rotate => expect(rotate).to.be.true)
  })

  it('should not rotate delay', function() {
    let l = new Logger('one', 'two', {
      delay: '1d'
    })

    let ctime = moment().subtract(12, 'hours')

    return l.rotate({ctime: ctime, size: 0})
      .then(rotate => expect(rotate).to.be.false)
  })

  it('should rotate size', function() {
    let l = new Logger('one', 'two', {
      size: 1024
    })

    return l.rotate({ctime: new Date(), size: 2048})
      .then(rotate => expect(rotate).to.be.true)
  })

  it('should not rotate size', function() {
    let l = new Logger('one', 'two', {
      size: 1024
    })

    return l.rotate({ctime: new Date(), size: 1024})
      .then(rotate => expect(rotate).to.be.false)
  })
})
