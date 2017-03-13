'use strict';
var p = require('path')
var CloudWorker = require(src + '/workers/CloudWorker.js')
var ForkTask = require(src + '/tasks/ForkTask.js')
var fork = require('child_process').fork
var ScriptTask = require(src + '/tasks/ScriptTask.js')
var CallableTask = require(src + '/tasks/CallableTask.js')
var worker

describe('CloudWorker', function() {
  it('should fail adding a ForkTask', function() {
    var task_fork = fork(p.join(__dirname, '../fixtures/answer.js'))
    var task = new ForkTask(task_fork)

    let worker = new CloudWorker()

    try {
      worker.add(task)
    } catch(e) {
      expect(e).to.be.an.instanceof(TypeError) 
      expect(e.message).to.equal('Task must be an instance of ScriptTask or CallableTask') 
      task.kill()
    }
    
  })

  it('should add and remove a task', function() {
    let testworker  = CloudWorker({strategy: require(src+'/strategies/WeightedStrategy.js')})
    let task = ScriptTask(fixtures + '/timeout.js')
    task.name = 'test'
    testworker.add(task)

    //registering events before start
    testworker.on('exit', function() {
    })

    testworker.once('start', function() {
    })

    //events will bind to the ipc channel
    return testworker.remove('test')
    .then(function() {
      expect(testworker.task('test')).to.be.undefined
      expect(testworker.tasks.size).to.equal(0)
    })
  })

  it('should add and run two tasks', function() {
    
    let tasks = [
      new CallableTask(fixtures + '/server.js'),
      new CallableTask(fixtures + '/server.js')
    ]

    worker = CloudWorker();

    for(let i in tasks) {
      tasks[i].name = 'test'+i 
      worker.add(tasks[i])
    }

    return worker.run()
  })

  it('should add and start a third one', function() {
    let task = new CallableTask(fixtures + '/server.js')
    task.name = 'test3'
    worker.add(task) 

    return worker.run()
  })

  it('should receive one answer', function(cb) {
    worker.send('ping')
    worker.once('pong', cb)
  })

  it('should get one answer', function() {
    return worker.get('hello')
    .then(function(val) {
      expect(val).to.equal('world') 
      return Promise.resolve()
    })
  })

  it('should call', function(cb) {
    worker.call('me')
    worker.once('calling', cb)
  })

  it('should exit worker', function(cb) {
    worker.kill()
    let i = 0;
    worker.on('exit', function() {
      i++
      if(i === 3) 
        cb()
    })
  })

  it('should reject the promise because task is not callable', function() {
    worker  = new CloudWorker()
    let task = new ScriptTask(fixtures + '/server.js')
    task.name = 'test'
    worker.add(task)

    return worker.run()
    .then(function() {
      return worker.call('test') 
      .catch(function(e) {
        expect(e).to.be.an.instanceof(ReferenceError) 
        expect(e.message).to.equal("The task has no 'call' method") 

        worker.kill()
        return Promise.resolve()
      })
    })
  })

})
