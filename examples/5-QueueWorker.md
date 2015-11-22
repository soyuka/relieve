The [QueueWorker]{@link module:workers/QueueWorker~QueueWorker} does not accept ForkTasks. It will handle start/stop action, and therefore when a Task is added it must not be started.

The QueueWorker expect tasks to exit once their job is done, it'll then start queued tasks according to the concurrency setting. 
If you want to run things in series or in parallel, you'll have to set the according concurrency. For example, having a concurrency to 1 will run each task when the previous one exits. On the other hand, setting concurrency to 10 will run at most 10 tasks at once. 

For example:

```
var relieve = require('relieve')
var ScriptTask = relieve.tasks.ScriptTask
var QueueWorker = relieve.workers.QueueWorker

var worker = new QueueWorker({concurrency: 10})
worker.add(new ScriptTask('sometask.js'))
worker.add(new ScriptTask('sometask.js'))

worker.run()
//each task has exit, we can remove them from the worker
.then(function() {
  for(let t of worker.tasks) {
    worker.remove(t.name) 
  }
})
```

You can find working use cases [here](./usecases).

### Compressing Task

```javascript
//task.js
'use strict';
var archiver = require('archiver')
var fs = require('fs')
var channel

module.exports = {
  setChannel: function(channel) {
    var archive = archiver('zip')
    var action = process.argv[3]
    var output = fs.createWriteStream(action.dest)

    output.on('close', function() {
      channel.send('finish', archive.pointer() + ' bytes written') 
      process.exit(0) //Note that we exit this tasks when it's done
    })

    archive.on('error', function(err) { throw err })
    archive.pipe(output)
    archive.bulk([action.src])
    archive.finalize()
  }
}
```

This task, when started, will compress things we gave through the task arguments. The QueueWorker will be able to run lots of those in separated processes.

```javascript
'use strict';
var relieve = require('relieve')
var ScriptTask = relieve.tasks.ScriptTask
var QueueWorker = relieve.workers.QueueWorker

var worker = new QueueWorker({concurrency: 10})

//assuming that I have a request for 5 compressions
var actions = [
  {src: ['fixtures/somepath', 'fixtures/somedir/'], dest: 'one.zip'},
  {src: ['fixtures/foo'], dest: 'two.zip'},
  {src: ['fixtures/bar'], dest: 'three.zip'},
  {src: ['fixtures/video.mkv', 'fixtures/audio.mp3'], dest: 'four.zip'},
  {src: ['fixtures/directory/*'], dest: 'five.zip'},
]

//I'm creating one task per action
for(let i in actions) {
  var task = new ScriptTask(__dirname + '/task.js')
  task.name = actions[i].dest //the name is the destination name
  task.arguments = [actions[i]] //give my action as arguments to the task

  worker.add(task)
}

//compress everything
worker.run()
//remove tasks when done
.then(function() {
  for(let t of worker.tasks) {
    worker.remove(t.name) 
  }
})

```

### Cksfv

`cksfv` is a tool that compares CRC hashes. It is commonly used to check the integrity of a multi-part rar file. It works by calculating the hash of each file and comparing the hash to the expected one. 
This example shows how the QueueWorker can be used to share a cpu-intensive task through multiple process. My benchmarks shows an improvement with many large parts, it won't show improvements with small parts (ie < 100mb).

For example, using 50 250mb parts, having a 20 concurrency:

- without workers 832125ms (13.8 min), cpu use is about 32% on one process
- without workers 225141ms (3.75 min), cpu use is about 2% on each of the 20 child processes

The Task: 

```
//task.js
'use strict';
var channel
var readLine = require('./readLine.js')

module.exports = {
  setChannel: function(c) {
    channel = c 
  },
  readLine: function(path, line) {
    readLine(path, line)
    .then(function(resp) {
      channel.send('cksfv', resp) 
      process.exit(0)
    })
  }
}
```

This is the part that calculates the CRC hash:

```
//readLine.js
'use strict';
var Promise = require('bluebird')
var crc = require('crc')
var fs = Promise.promisifyAll(require('fs'))
var p = require('path')

function readLine(path, line) {
  if(!line.trim())
    return Promise.resolve()

  var original = line.trim().slice(-8)
  var filepath = line.slice(0, -9).trim()
  var resp = {original: original, filepath: filepath}

  console.log('Processsing %s', p.resolve(p.dirname(path), filepath))

  return fs.readFileAsync(p.resolve(p.dirname(path), filepath))
  .then(function(buffer) {
    var str = crc.crc32(buffer).toString(16)

    while(str.length < 8) {
      str = '0'+str 
    }
  
    resp.calculate = str

    return resp
  })
}

module.exports = readLine
```

The Worker reads the `.sfv` file and sends every line to a new Task.

It's then executed with: `node worker.js path/to/file.sfv`.

```
//worker.js
'use strict';
var relieve = require('relieve')
var assert = require('assert')
var Promise = require('bluebird')
var p = require('path')
var fs = Promise.promisifyAll(require('fs'))
var eol = require('os').EOL
var CallableTask = relieve.tasks.CallableTask
var QueueWorker = relieve.workers.QueueWorker

assert.ok(
  typeof process.argv[2] == 'string' && p.extname(process.argv[2]) == '.sfv',
  'Sfv file must be provided'
);

var path = process.argv[2]
var map = []

//Call my task method
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

  //Creates tasks for each lines, those are not started yet
  data.map(function(line) {
    let task = new CallableTask(__dirname + '/task.js')
    task.name = line
    task.once('start', call(line))
    task.once('cksfv', function(resp) {
      map.push(resp)
    })
    worker.add(task) 
  })

  //Here we start tasks keeping a 20 concurrency
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
```
