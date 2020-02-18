'use strict';
const ScriptTask = require('relieve/tasks/ScriptTask')
const Worker = require('relieve/workers/Worker')
const CallableTask = require('relieve/tasks/CallableTask')
const FailSafe = require('../src/index.js')
const relieveFixturesPath = `${__dirname}/../node_modules/relieve/test/fixtures`
const expect = require('chai').expect
const existsSync = require('@soyuka/exists-sync')
const fs = require('fs')

const os = require('os').platform()
const SOCKET = os === 'win32' ? `\\\\?\\pipe\\${__dirname}\\e2e.sock`: `./e2e.sock`

let failSafety = new FailSafe({SOCKET: SOCKET, PERSISTENCE: './relieve.count'})
let task
let startedAt

describe('e2e ScriptTask', function() {
  before(function() {
    if (existsSync('./relieve.count')) {
      fs.unlinkSync('./relieve.count')
    }
  })

  after(function() {
    if (existsSync('./relieve.count')) {
      fs.unlinkSync('./relieve.count')
    }
  })

  it('should start a Worker', function() {
    const worker = new Worker()

    let task = new CallableTask(`${relieveFixturesPath}/arguments.js`, {
      interfaces: [new FailSafe({SOCKET: SOCKET, PERSISTENCE: './relieve.count'})]
    })
    task.name = 'foo'

    worker.add(task)

    let task2 = new CallableTask(`${relieveFixturesPath}/arguments.js`, {
      interfaces: [new FailSafe({SOCKET: SOCKET, PERSISTENCE: './relieve.count'})]
    })
    task2.name = 'bar'

    worker.add(task2)

    return worker.start()
    .then(e => {
      expect(worker.tasks.size).to.equal(2)

      return worker.remove('foo')
    })
    .then(e => {
      expect(worker.tasks.size).to.equal(1)
      expect(worker.task('foo')).to.be.undefined

      return worker.remove('bar')
    })
  })

  it('should create a new ScriptTask', function() {
    task = new ScriptTask(`${relieveFixturesPath}/script.js`, {
      interfaces: [failSafety]
    })

    return task.start()
    .then(() => {
      startedAt = task.startedAt
      return Promise.resolve()
    })
  })

  it('should reject starting again', function(cb) {
    task.start()
    .catch(function(e) {
      expect(e).to.be.an.instanceof(ReferenceError)
      expect(e.message).to.equal('Already running')
      cb()
    })
  })

  it('should restart', function() {
    return task.restart()
    .then(() => {
      expect(task.restarts).to.equal(1)
      expect(task.running).to.be.true
      expect(task.startedAt).not.to.equal(startedAt)
      return Promise.resolve()
    })
  })

  it('should reject start', function(cb) {
    task.start()
    .catch(function(e) {
      expect(e).to.be.an.instanceof(ReferenceError)
      expect(e.message).to.equal('Already running')
      cb()
    })
  })

  it('should kill', function(cb) {
    task.kill()

    task.once('exit', function(code) { cb() })
  })

  it('should create an autorestart task', function(cb) {
    task = new ScriptTask(`${relieveFixturesPath}/script.js`, {
      interfaces: [failSafety],
			restart: true
    })

   task.once('restart', cb)

   task.start()
   .then(() => task.kill())
  })

  it('should stop and not restart', function(cb) {
    setTimeout(() => {
      task.once('exit', () => cb())
      task.once('restart', () => cb())

      task.stop()
      .then(() => {})
    }, 200)
  })

  it('should register event before starting', function(cb) {
    task = new ScriptTask(`${relieveFixturesPath}/server.js`, {
      interfaces: [failSafety]
    })

    task.once('started', cb)
    task.start()
  })

  it('should send a message to the task and resolve promise when message has been delivered', function() {
   return task.send('message', 'hello', 'world')
   .then(function(t) {
      expect(t).to.deep.equal(task)
      return task.stop()
   })
  })

  it('should fail sending a message if the task is not started', function(cb) {
   let task = new ScriptTask(`${relieveFixturesPath}/script.js`, {
      interfaces: [failSafety]
    })

    try {
      task.send('message', 'hello', 'world')
    } catch(e) {
      expect(e).to.be.an.instanceof(ReferenceError)
      expect(e.message).to.equal('The task is not running')
      cb()
    }
  })

  it('should start a task with arguments', function(cb) {
    let task = new ScriptTask(`${relieveFixturesPath}/arguments.js`, {
      interfaces: [failSafety]
    })

    task.once('arguments', function(args) {
      expect(args[1]).to.equal('Hello World')

      task.stop()
      .then(e => {
        cb()
      })
    })

    task.start('Hello World')
  })

  it('should start a task with complex arguments', function(cb) {
   let task = new ScriptTask(`${relieveFixturesPath}/arguments.js`, {
      interfaces: [failSafety]
    })

   task.once('arguments', function(args) {
     expect(args[1]).to.deep.equal({src: 'This', dest: 'That'})
     expect(args[2]).to.deep.equal(['foo', 'bar'])

     task.stop()
     .then(cb)
   })

   task.arguments = [{src: 'This', dest: 'That'}, ['foo', 'bar']]
   task.start()
  })

  it('should start a callable task', function() {
   let task = new CallableTask(`${relieveFixturesPath}/script.js`, {
      interfaces: [failSafety]
    })

    return task.start()
    .then(e => {
      return task.get('getMe', {foo: 'bar'})
      .then(e => {
        expect(e).to.deep.equal({foo: 'bar'})

        return task.stop()
      })
    })
  })
})
