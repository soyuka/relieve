'use strict';
var Worker = require(src + '/workers/Worker.js')
var worker = Worker()
var p = require('path')
var Task = require(src + '/tasks/ForkTask.js')
var fork = require('child_process').fork

var task = new Task(fork(p.join(__dirname, '../fixtures/answer.js')))
task.name = 'test'

var task2 = new Task(fork(p.join(__dirname, '../fixtures/answer.js')))
task2.name = 'test2'

describe('Worker', function(cb) {
  it('should add a task', function() {
    worker.add(task)

    expect(worker.task('test')).to.deep.equal(task)
  })

  it('should add a second task and get them all', function() {
    worker.add(task2)

    let tasks = worker.tasks

    expect(tasks).to.be.an.instanceof(Map)
    expect(tasks.size).to.equal(2)
  })

  it('should send a message to every task', function() {
    return worker.send('message', 'hello')
  })

  it('should remove task', function() {
    return worker.remove('test')
    .then(function() {
      expect(worker.task('test')).to.be.undefined
      expect(worker.tasks.size).to.equal(1)
    })
  })

  it('should send SIGINT to tasks', function(cb) {
    worker.kill()

    worker.once('exit', function() {
      expect(worker.tasks.size).to.equal(0)
      cb()
    })
  })

  it('should not be able to set tasks', function() {
    try {
     worker.tasks = {}
    } catch(e) {
      expect(e).to.be.an.instanceof(ReferenceError)
      expect(e.message).to.equal('Property is read-only')
    }
  })
})
