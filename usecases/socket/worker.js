'use strict';
var relieve = require('../../index.js')
var CallableTask = relieve.tasks.CallableTask
var Worker = relieve.workers.CloudWorker
var net = require('net')

const RANDOM_MIN = 1
const RANDOM_MAX = 156 //78 iterations until Number.MAX_SAFE_INTEGER

var worker = new Worker()

let i = 0
let len = 4
for (; i < len; i++) {
  let task = new CallableTask(__dirname + '/task.js')
  task.name = 'task'+i
  worker.add(task)
}

worker.run()

var server = net.createServer()

server.on('connection', function(socket) {
  worker.send('socket', socket)
  .then(function(task) {
    let n = Math.floor(Math.random() * (RANDOM_MAX - RANDOM_MIN + 1)) + RANDOM_MIN
    task.call('doHeavyStuff', n) 
  })
})

server.listen(2333, function() {
  console.log('server listening on %j', server.address());  
})
