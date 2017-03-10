Interfaces are tools you can use to improve your process management.

For the following examples, you can use a basic `task.js`:

```javascript
// task.js
var ipc = process.relieve.ipc

module.exports = {
  start: function() {
    ipc.on('ping', function() {
      ipc.send('pong')
    })

    setInterval(e => {
      console.log('Still alive')
    }, 1000)
  }
}
```

### Logs

For example, you may want to set up `relieve-logger` to output logs in a file and handle log rotation out of the box:

```
npm install relieve-logger --save #you should have relieve already
```

```javascript
// worker.js
var Logger = require('relieve-logger')
var ScriptTask = require('relieve/tasks/ScriptTask')

var logger = new Logger(`logs/out.log`, `logs/err.log`, {delay: '1d'}) // creates a logger that rotates files every day

var task = new ScriptTask('task.js', {
  interfaces: [logger]
})
```

Yes, that's all you need to do so that `task.js` outputs its logs in `logs/out|err.log` with file rotation!

### FailSafe

Now, with `relieve`, we're in a world where there is a Worker (Master) and one or more Tasks (Child). You may be wondering what happens to your Task if the Worker exits. Well, as we use IPC by default, and that the child process is not detached, the Task will also die.

This may be a problem, especially if the Task is way more important then the worker. Usually the worker is only there to manage the tasks, and the task should have no trouble working without the worker.

For this to work, let me introduce the `FailSafe` interface. Instead of using the IPC protocol, it transparently replaces it by a TCP protocol having the same API.

First let's install the `FailSafe` interface:

```
npm install relieve-failsafe --save
```

To use this, simply add the interface:

```javascript
// worker.js
var CallableTask = require('relieve/tasks/ScriptTask')
var FailSafe = require('relieve-failsafe')

var task = new ScriptTask('task.js', {
  interfaces: [new FailSafe()]
})

task.start()
.then(() => {
  task.on('pong', () => console.log('got pong'))

  task.call('ping')
})
```

Now launch the `worker.js` script, your task is up. Kill the worker, the task is still up. Restart the worker, it'll re-attach the task.

> But wait, how do I kill my task now?

Just use `task.stop()` from the worker:

```javascript
task.stop()
```

### Combine everything

A more complex example sets up a full-featured task with automatic logging, master-independent and a method to get usage data:

```javascript
var CallableTask = require('relieve/tasks/ScriptTask')
var Logger = require('relieve-logger')
var FailSafe = require('relieve-failsafe')
var monitorContainer = require.resolve('relieve/containers/MonitorContainer')

var logger = new Logger('out.log', 'err.log')
var failSafety = new FailSafe()

var t = new CallableTask(task.script, {
  interfaces: [logger, failSafety],
  childprocess: {
    env: {
      SOME_ENV_VARIABLE: 'foobar'
    }
  },
  containers: [monitorContainer],
  restart: true
})
```
