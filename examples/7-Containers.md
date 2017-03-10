Containers are surrounding your process, therefore they're really useful if you want to give your processes access to global remote methods.

A perfect example is to leverage the new `process.cpuUsage`, 'process.memoryUsage' or `process.uptime()`. For this, there is a `MonitorContainer` you can use in any task:

```javascript

var CallableTask = require('relieve/tasks/CallableTask')
var monitorContainer = require.resolve('relieve/containers/MonitorContainer') //gives the module path

var task = new CallableTask('task.js', {
  containers: [
  	monitorContainer
  ]
})

task.start()
.then(function() {
	task.once('usage', function(usage) {
    console.log(usage)

    /**
     * The usage object has the following data:
     *
     * {
     *   cpu: process.cpuUsage(),
     *   cpuPercent: 100, // percent usage computed through hrtime
     *   memory: process.memoryUsage(),
     *   pid: process.pid,
     *   uptime: process.uptime()
     * }
     *
     */

  })

	task.send('usage')
})

```

Container are scripts that are required before your script task. They can (and should) use the available `process.relieve.ipc` communication channel.

It's a great way to abstract things you'd need in every tasks. As this is a simple script, that doesn't need any `exports` you can add your own without breaking anything on relieve internals. For example, the `MonitorContainer` code is pretty straightforward:

```javascript
// Relieve has not been loaded, load it
if (!process.relieve) {
  require('./CallableContainer.js') //can also be 'relieve/containers/CallableContainer'
}

const os = require('os')
const ipc = process.relieve.ipc

let cpuUsage
let time

ipc.on('usage', function() {
  cpuUsage = process.cpuUsage(cpuUsage)
  time = process.hrtime(time)

  let cpuPercent = (100 * (cpuUsage.system / 1000 + cpuUsage.user / 1000) / (time[0] * 1000 + time[1] / 1e6))

  ipc.send('usage', {
    cpu: cpuUsage,
    cpuPercent: cpuPercent,
    memory: process.memoryUsage(),
    pid: process.pid,
    uptime: process.uptime()
  })
})
```
