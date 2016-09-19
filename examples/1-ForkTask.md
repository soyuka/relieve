A [Fork Task]{@link module:tasks/ForkTask~ForkTask} implements a simple task from an existing [fork](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options) object.

The Fork task:

```javascript
//task.js
process.send('start')
```

This would be the task worker:

```javascript
//worker.js
var ForkTask = require('relieve/tasks/ForkTask')
var fork = require('child_process').fork

var task_fork = fork('task.js')

task = new ForkTask(task_fork)
task.name = 'MyForkTask'

task.once('start', function() {
  //task started
})
```

Another example using IPCEE to ease the communication:

```javascript
//task.js
var IPCEE = require('relieve/IPCEE')

var ipc = IPCEE(process)

ipc.on('thank', function(person) {
  if(person == 'you')
    ipc.send('you', 'welcome')
})
```

The worker:

```javascript
//worker.js
var ForkTask = require('relieve/tasks/ForkTask')
var fork = require('child_process').fork

task = new ForkTask(fork('task.js'))

//wrapper.js
task.send('thank', 'you')

task.once('you', function(data) {
  //data is welcome
})
```
