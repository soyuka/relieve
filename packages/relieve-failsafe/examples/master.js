// master.js
const ScriptTask = require('relieve/tasks/ScriptTask')
const FailSafe = require('../src/index.js')

const task = new ScriptTask(`${__dirname}/task.js`, {
  interfaces: [new FailSafe()]
})

task.start()
.then(() => {
  task.on('pong', () => {
    console.log('got pong!')
  })

  task.send('ping')
})
