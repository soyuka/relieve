## Relieve [![Test Coverage](https://codeclimate.com/github/soyuka/relieve/badges/coverage.svg)](https://codeclimate.com/github/soyuka/relieve/coverage) [![Code Climate](https://codeclimate.com/github/soyuka/relieve/badges/gpa.svg)](https://codeclimate.com/github/soyuka/relieve) [![Build Status](https://travis-ci.org/soyuka/relieve.svg?branch=master)](https://travis-ci.org/soyuka/relieve) [![Build status](https://ci.appveyor.com/api/projects/status/kixnoqeg0tntgaad?svg=true)](https://ci.appveyor.com/project/soyuka/relieve)

The goal of this library is to ease the implementation of multi processing accross your existing microservices.
Relieve aims to give a reusable design pattern using process forks. It also eases communication with child processes with an high-level abstraction.

For example, with a CallableTask:

```javascript
//task.js
//just export a module in the child process
module.exports = {
  print: (str) => {
    console.log(str)
  },
  data: () => {
    //return some async data
    return Promise.resolve({foo: 'bar'})
  }
}
```

Then from your master, just call the task:

```javascript
//worker.js
var CallableTask = require('relieve/tasks/CallableTask')
var task = new CallableTask('task.js')

task.start()
.then(() => {
  task.call('print', 'hello world')
  return task.get('data')
})
.then(d => {
  //d is {foo: 'bar'}
})
```

### The design pattern

Relieve is based on a design pattern containing:
- A Worker
- One or more tasks

![](https://raw.githubusercontent.com/soyuka/relieve/master/examples/images/relieve.jpg)

The task can be used without a Worker, but the Worker helps managing workflows.

### Task

The task will implement a child process using `fork`. It'll make sure that there is an ipc channel open so that Workers and Tasks can communicate.
There are different tasks implementations:

- Fork Task - simply transforms a `ChildProcess.fork` in a Task
- Script Task - wraps a script path in a container that is managed through `ChildProcess.fork`. It gives the ability to start, restart or kill a Task
- Callable Task - this is a Script Task with convenience methods to `call` or `get` script methods remotely


#### Tutorials:

- [Fork Task](http://soyuka.github.io/relieve/tutorial-1-ForkTask.html)
- [Script Task](http://soyuka.github.io/relieve/tutorial-2-ScriptTask.html)
- [Callable Task](http://soyuka.github.io/relieve/tutorial-3-CallableTask.html)

### Worker

Different kind of Workers for different use cases. Every Worker takes one or more tasks and handles them.

- Worker - it's a basic worker. Helps sending a message to every task.
- QueueWorker - process tasks one after the other, or in concurrency. Waits for a Task to exit before it consider's it as done.
- CloudWorker - does not wait for tasks to exit and process them through a Strategy (ie: RoundRobin)

#### Tutorials:

- [Worker](http://soyuka.github.io/relieve/tutorial-4-Worker.html)
- [QueueWorker](http://soyuka.github.io/relieve/tutorial-5-QueueWorker.html)
- [CloudWorker](http://soyuka.github.io/relieve/tutorial-6-CloudWorker.html)

### Links
- [Documentation](http://soyuka.github.io/relieve/)
- [Coverage](http://soyuka.github.io/relieve/coverage/lcov-report/)
- [Blog post](https://soyuka.me/having-fun-with-nodejs-child-processes/)

### TODO

- Documentation monitorable container
- Documentation interfaces
- Documentation logger
- Documentation fail safe
