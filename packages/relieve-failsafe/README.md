# Relieve-failsafe [![Build Status](https://travis-ci.org/soyuka/relieve-failsafe.svg?branch=master)](https://travis-ci.org/soyuka/relieve-failsafe)

Relieve failsafe interface

This interface allows you to launch independent microservices that will maintain an open channel with a master process. This master process can die safely, as the child process will stay alive and reconnect when he can.

This is still an experimental module!

## Usage

If you're not familiar with the `relieve` library, please check out it's usage first [here](https://github.com/soyuka/relieve).

```
npm install relieve relieve-failsafe
```

Task:

```javascript
// task.js
const ipc = process.relieve.ipc

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

Master:

```javascript
// master.js
const ScriptTask = require('relieve/tasks/ScriptTask')
const FailSafe = require('relieve-failsafe')

const task = new ScriptTask('task.js', {
  interfaces: [new FailSafe()]
})

task.start()
.then(() => {
  task.on('pong', () => {
    console.log('got pong!')
  })

  task.call('ping')
})
```

You can test this example by cloning this repository and by launching `node examples/master`. The task will have to be killed manually.
