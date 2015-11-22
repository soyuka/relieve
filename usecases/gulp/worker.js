'use strict';
var relieve = require('../../index.js')
var ScriptTask = relieve.tasks.ScriptTask
var QueueWorker = relieve.workers.QueueWorker
var argv = require('minimist')(process.argv.slice(2));

let worker = new QueueWorker({concurrency: 2})

for(let i in argv._) {
  let task = new ScriptTask(__dirname + '/task.js')
  task.name = argv._[i]
  task.arguments = [task.name]
  worker.add(task)
}

worker.run()
.then(function() {
  process.exit(0)
})
