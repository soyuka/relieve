'use strict';
var ScriptTask = require(src + '/tasks/ScriptTask.js')
var p = require('path')
var task

describe('ScriptTask', function() {
  
  it('should fail creating a new ScriptTask', function() {
    try{ new ScriptTask({foo: 'bar'})} catch(e) { 
      expect(e).to.be.an.instanceof(TypeError)   
      expect(e.message).to.equal('Script must be a string!')
    }
  })

  it('should create a new ScriptTask', function() {
   task = new ScriptTask(p.resolve(__dirname, '../fixtures/script.js'))
   return task.start()
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
  })

  it('should start', function() {
   return task.start() 
  })

  it('should kill', function(cb) {
    task.kill()

    task.once('exit', function(code) { cb() })
  })

  it('should create an autorestart task', function(cb) {
   task = new ScriptTask(p.resolve(__dirname, '../fixtures/script.js'), {restart: true, restartDelay: 200})

   task.once('restart', cb)

   task.start()
   .then(() => task.kill())
  })

  it('should register event before starting', function(cb) {
    task = new ScriptTask(p.resolve(__dirname, '../fixtures/server.js'))    
    task.once('started', cb)
    return task.start()
  })

  it('should send a message to the task and resolve promise when message has been delivered', function() {
   return task.send('message', 'hello', 'world')
   .then(function(t) {
      expect(t).to.deep.equal(task) 
      return Promise.resolve()
   })
  })

  it('should fail sending a message if the task is not started', function(cb) {
   let task = new ScriptTask(p.resolve(__dirname, '../fixtures/script.js'))

    try {
      task.send('message', 'hello', 'world') 
    } catch(e) {
      expect(e).to.be.an.instanceof(ReferenceError) 
      expect(e.message).to.equal('The task is not running') 
      cb()
    }
  })

  it('should start a task with arguments', function(cb) {
   let task = new ScriptTask(p.resolve(__dirname, '../fixtures/arguments.js')) 

   task.start('Hello World')

   task.once('arguments', function(args) {
     expect(args[3]).to.equal('Hello World')

     task.kill()

     process.nextTick(cb)
   })
  })

  it('should start a task with complex arguments', function(cb) {
   let task = new ScriptTask(p.resolve(__dirname, '../fixtures/arguments.js')) 

   task.arguments = [{src: 'This', dest: 'That'}, ['foo', 'bar']]
   task.start()

   task.once('arguments', function(args) {
     expect(args[3]).to.deep.equal({src: 'This', dest: 'That'})
     expect(args[4]).to.deep.equal(['foo', 'bar'])

     task.kill()

     process.nextTick(cb)
   })
  })
})
