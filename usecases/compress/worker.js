'use strict';
var relieve = require('../../index.js')
var ScriptTask = relieve('tasks').ScriptTask
var QueueWorker = relieve('workers').QueueWorker

var worker = new QueueWorker({concurrency: 10})

//assuming that I have a request for 5 compressions
var actions = [
  {src: ['fixtures/somepath', 'fixtures/somedir/'], dest: 'one.zip'},
  {src: ['fixtures/foo'], dest: 'two.zip'},
  {src: ['fixtures/bar'], dest: 'three.zip'},
  {src: ['fixtures/video.mkv', 'fixtures/audio.mp3'], dest: 'four.zip'},
  {src: ['fixtures/directory/*'], dest: 'five.zip'},
]

for(let i in actions) {
  var task = new ScriptTask(__dirname + '/task.js')
  task.name = actions[i].dest
  task.arguments = [actions[i]]

  worker.add(task)
}

worker.run()
.then(function() {
  for(let t of worker.tasks) {
    worker.remove(t.name) 
  }
})
