The [CloudWorker]{@link module:workers/CloudWorker~CloudWorker} does not accept ForkTasks. It will handle start/stop action, and therefore when a Task is added it must not be started.

The CloudWorker differs from the QueueWorker in which it does not wait for tasks to end. It assumes that tasks should run forever, and therefore works well with the `autorestart` feature.
Then, the CloudWorker works with a Strategy, like a Round-Robin that will give the next available task. The default Strategy is a weight strategy that increments/decrements a task-basis counter according to the number of calls the task gets.

For example:

```
var relieve = require('relieve')
var CallableTask = relieve.tasks.CallableTask
var CloudWorker = relieve.workers.CloudWorker

var worker = new CloudWorker()
worker.add(new CallableTask('sometask.js'))
worker.add(new CallableTask('sometask.js'))

worker.run()
//every task has started
.then(function() {
  //send ping to the next available task
  worker.get('ping')
  //if it's a long running task, this second instruction
  //will most likely call the second task
  worker.get('ping')
})
```

### Socket task

Here we decide to send the Socket to the next available task, to process some data and send him back the requested data.

The task just handles the fibonnacci calculation, and sends the data directly to the socket.

```
//task.js
'use strict';
function fibonacci(max) {
  let x = -1;
  let i = 0;
  let j = 1;
  let k = 0;

  for(; k < max; i = j, j = x, k++)  {

    if(x > Number.MAX_SAFE_INTEGER) {
      console.error('Fibonacci stopeed at iteration %d', k);
      return {number: x, iterations: k, error: 'Number exceed the limit ('+Number.MAX_SAFE_INTEGER+')'}
    }

    x = i + j
  }

  return {number: x, iterations: k}
}

var socks = []
var channel = process.relieve.ipc

module.exports = {
  start: function() {
    channel.on('socket', function(socket) {
      socks.push(socket)
    })
  },
  doHeavyStuff: function(num) {
    let sock = socks.shift()
    let f = fibonacci(num)
    if(f.error) {
      sock.write('Fibonnacci errored with message: \n')
      sock.write(f.error + '\n')
      sock.end()
      return
    }

    sock.write(`Fibonnacci result for ${num} is ${f.number}\n`)
    sock.write(`${f.iterations} iterations done\n`)
    sock.end()
  }
}
```

The worker sends the incoming socket to one of our tasks.

```
'use strict';
var relieve = require('relieve')
var CallableTask = relieve.tasks.CallableTask
var Worker = relieve.workers.CloudWorker
var net = require('net')

const RANDOM_MIN = 1
const RANDOM_MAX = 156 //78 iterations until Number.MAX_SAFE_INTEGER

var worker = new Worker()

let i = 0
let len = 4
for (; i < len; i++) {
  let task = new CallableTask(__dirname + '/task.js', {restart: true})
  task.name = 'task'+i
  worker.add(task)
}

worker.run()

var server = net.createServer()

server.on('connection', function(socket) {
  //send the socket to the next available task
  worker.send('socket', socket)
  .then(function(task) {
    let n = Math.floor(Math.random() * (RANDOM_MAX - RANDOM_MIN + 1)) + RANDOM_MIN
    //call doHeavyStuff, the task will handle the response
    task.call('doHeavyStuff', n)
  })
})

server.listen(function() {
  console.log('server listening on %j', server.address());
})
```

To test this, simply plug a telnet on the server and watch.
