'use strict';
var relieve = require('../../index.js')
var assert = require('assert')
var Promise = require('bluebird')
var p = require('path')
var fs = Promise.promisifyAll(require('fs'))
var eol = require('os').EOL
var CallableTask = relieve('tasks').CallableTask
var QueueWorker = relieve('workers').QueueWorker

assert.ok(
  typeof process.argv[2] == 'string' && p.extname(process.argv[2]) == '.sfv',
  'Sfv file must be provided'
);

var path = process.argv[2]
var map = []

function call(line) {
  return function() {
    worker.task(line).call('readLine', path, line)
  }
}

var worker = new QueueWorker({concurrency: 20})

console.time('cksfv')

fs.readFileAsync(path)
.then(function(data) {
  data = data.toString()
    .split(eol)
    .map(e => e.trim())
    .filter(e => e.length)

  data.map(function(line) {
    let task = new CallableTask(__dirname + '/task.js')
    task.name = line
    task.once('start', call(line))
    task.once('cksfv', function(resp) {
      map.push(resp)
    })
    worker.add(task) 
  })

  worker.run()
  .then(function() {
    let errors = 0
    for(let i in map) {
      if(map[i].original != map[i].calculate) {
        console.error('File %s does not match crc', map[i].filepath) 
        errors++
      }
    }

    console.log('Done checking with %d errors', errors)
    console.timeEnd('cksfv')
  })
})
