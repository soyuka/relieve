'use strict';
var QueueWorker = require(src + '/workers/QueueWorker.js')
var p = require('path')
var ForkTask = require(src + '/tasks/ForkTask.js')
var fork = require('child_process').fork

var ScriptTask = require(src + '/tasks/ScriptTask')

var worker

describe('QueueWorker', function() {
  
  it('should fail adding a ForkTask', function() {
    var task_fork = fork(p.join(__dirname, '../fixtures/answer.js'))
    var task = new ForkTask(task_fork)

    let worker = new QueueWorker()

    try {
      worker.add(task)
    } catch(e) {
      expect(e).to.be.an.instanceof(TypeError) 
      expect(e.message).to.equal('Task must be an instance of ScriptTask or CallableTask') 
      task.kill()
    }
    
  })

  it('should add and remove a task', function() {
    let worker  = QueueWorker({concurrency: 1})
    let task = ScriptTask(fixtures + '/timeout.js')
    task.name = 'test'
    worker.add(task)

    worker.on('exit', function() {
    })
    worker.once('start', function() {
    })

    return worker.remove('test')
    .then(function() {
      expect(worker.task('test')).to.be.undefined
      expect(worker.tasks.size).to.equal(0)
    })
  })

  it('should add three tasks', function() {
    
    var tasks = [
      new ScriptTask(fixtures + '/timeout.js'),
      new ScriptTask(fixtures + '/timeout.js'),
      new ScriptTask(fixtures + '/timeout.js')
    ]

    worker = QueueWorker();

    for(let i in tasks) {
      tasks[i].name = 'test'+i 
      worker.add(tasks[i])
    }
  })

  it('should start one task', function() {
    this.timeout(400)

    var promise = worker.run('test1')

    worker.task('test1').once('response', function(t) {
      expect(t).to.equal('ok')
    })

    return promise
  })

  it('should start every task in series', function() {
    let i = 0

    function timesEvent(t) {
      expect(t).to.equal('ok') 
      i++
      expect(i <= 3).to.be.true
    }

    worker.once('response', timesEvent)

    return worker.run()
  })

  it('should start every tasks in concurrency', function() {
    worker.concurrency = 3
    expect(worker.concurrency).to.equal(3)
    return worker.run()
  })
})
