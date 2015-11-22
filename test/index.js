describe('utils', function() {
  require('./utils/defineNameProperty.js')
})

describe('strategies', function() {
 require('./strategies/WeightedStrategy.js') 
})

describe('task', function() {
  require('./tasks/ForkTask.js')
  require('./tasks/ScriptTask.js')
  require('./tasks/CallableTask.js')
})

describe('worker', function() {
  require('./workers/Worker.js')
  require('./workers/QueueWorker.js')
  require('./workers/CloudWorker.js')
})
