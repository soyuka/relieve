var CallableTask = require(src + '/tasks/CallableTask.js')
var p = require('path')
var task

describe('CallableTask', function() {
  it('should create a new CallableTask', function() {
   task = new CallableTask(p.resolve(__dirname, '../fixtures/script.js'))
   return task.start()
  })

  it('should create an autorestart callable task', function(cb) {
   task = new CallableTask(p.resolve(__dirname, '../fixtures/script.js'), {restart: true})

   task.once('restart', cb)

   task.start()
   .then(() => task.kill())
  })

  it('should create a new CallableTask without constructor', function() {
   task = CallableTask(p.resolve(__dirname, '../fixtures/script.js'), {})
   return task.start()
  })

  it('should call a function', function() {
    return task.call('callMe')
  })

  it('should have register an emiting interval', function(cb) {
   task.once('working', cb)
  })

  it('should stop the interval', function() {
    return task.get('stopMe')
    .then(function(response) {
      expect(response).to.equal(true)
    })
  })

  it('should get the value', function() {
    return task.get('name')
    .then(function(response) {
      expect(response).to.equal('script')
    })
  })

  it('should get the args', function() {
    return task.get('getMe', 'hello')
    .then(function(response) {
      expect(response).to.equal('hello')
    })
  })

  it('should throw an get error event', function(cb) {
    task.call('throw')

    task.once('error', function(err, stack) {
      expect(err).not.to.be.undefined
      expect(stack).not.to.be.undefined
      cb()
    })
  })

  it('should create a new CallableTask with a different Container', function() {
   task = new CallableTask(p.resolve(__dirname, '../fixtures/script.js'), {container: p.resolve(src, 'containers/ScriptContainer.js')})
    return task.start()
  })

  it('should kill the task', function() {
    return task.kill()
  })

  it('should be monitorable', function(cb) {
    let monitorContainer = `${__dirname}/../../containers/MonitorContainer.js`
    task = new CallableTask(p.resolve(__dirname, '../fixtures/script.js'), {containers: [monitorContainer]})

    task.start()
    .then(() => {
      task.send('usage')
      task.once('usage', function(t) {
        expect(t).to.have.property('memory')
        expect(t).to.have.property('cpu')
        cb()
      })
    })
  })
})
