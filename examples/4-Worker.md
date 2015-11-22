A [Worker]{@link module:workers/Worker~Worker} allows to manage multiple tasks. This Worker covers only basic features and it is the base for the [CloudWorker]{@link module:workers/CloudWorker~CloudWorker} and the [QueueWorker]{@link module:workers/QueueWorker~QueueWorker}.

For example, having a simple task that answer to my messages:

```javascript
//answer.js
process.on('message', function(d) {
  process.send(d)
})
```

My worker will handle a couple of tasks:

```javascript
//worker.js
var Worker = require('relieve').workers.Worker
var Task = require('relieve').tasks.ForkTask

var task1 = new Task(fork('answer.js'))
task1.name = 'task1'
var task2 = new Task(fork('answer.js'))
task2.name = 'task2'

worker.add(task1).add(task2)

//send a message to every task
worker.send('message', 'hello world')
//Promise resolves when every message has reach the task
.then(function() {
  worker.kill()
})
```

The worker also allows to retreive tasks:

```javascript
//by name
worker.task('task1').send('message', 'hello world')

//or through a Map
for(let t of worker.tasks.values()) {
  t.send('message', 'hello world')
}
```

See more advanced use cases with the [QueueWorker]{@tutorial 5-QueueWorker} or the [CloudWorker]{@tutorial 6-CloudWorker}.
