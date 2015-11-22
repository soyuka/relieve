The [Callable Task]{@link module:tasks/CallableTask~CallableTask} takes a script path as does the [Script Task]{@tutorial ScriptTask}. It allows the worker to call function, and expect (or not) ans answer.

Using an [archiver](https://github.com/archiverjs) task that will zip a directory:

The Task:

```javascript
//task.js
var archiver = require('archiver')
var fs = require('fs')
var channel
var archive 

function archiveDirectory(dir) {
  archive = archiver('zip')
  var output = fs.createWriteStream('archive.zip')

  output.on('close', function() {
    channel.send('finish', archive.pointer() + ' bytes written') 
  })

  archive.on('error', function(err) { throw err })

  archive.pipe(output)

  archive.directory('./', 'dest')
  archive.finalize()
}

module.exports = {
  setChannel: function(c) { channel = c },
  archiveDirectory: archiveDirectory,
  bytesWritten: function() { return archive.pointer() }
}
```

The [Callable Task]{@link module:tasks/CallableTask~CallableTask} can call the `archiveDirectory` method. It'll launch an archive and it then calls `bytesWritten` to get back some progression. When the task finishes, we clear the interval and print the final message.

The Worker:

```javascript
//worker.js
var CallableTask = require('relieve').tasks.CallableTask

var task = new CallableTask('task.js', {restart: true})

task.start()
.then(function() {
  task.call('archiveDirectory', './directory')

  var bytesInterval = setInterval(function() {
    console.log(task.get('bytesWritten'))
  }, 100)

  task.once('finish', function(message) {
    console.log(message)
    clearInterval(bytesInterval) 
  })
})
```
