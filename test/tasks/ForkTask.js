var Task = require(src + '/tasks/ForkTask.js')
var fork = require('child_process').fork
var p = require('path')
var task

describe('ForkTask', function() {
  
  it('should throw because ipc is not available', function() {
    try {
      new Task({foo: 'bar'})  
    } catch(err) {
      expect(err.message).to.equal('IPC is not enabled') 
    }
  })

  it('should create a new without constructor', function() {
    var task_fork = fork(p.join(__dirname, '../fixtures/answer.js'))
    task = Task(task_fork)
  })

  it('should create a new task', function() {
    var task_fork = fork(p.join(__dirname, '../fixtures/answer.js'))
    task = new Task(task_fork)
    task.name = 'test'
  })

  it('should get message through task', function(cb) {
   task.once('test', function(x, y) {
     expect(x).to.deep.equal({foo: 'bar'})
     expect(y).to.deep.equal([0,1,2])
     cb() 
   }) 

   task.send('test', {foo: 'bar'}, [0,1,2])
  })

  it('should not be available because child has been killed', function(cb) {
   task.kill()

   task.once('exit', function() {
     process.nextTick(function() {
       expect(task.client).to.be.undefined
       cb()
     })
   })

  })
})
