if (!process.relieve) {
  require('./CallableContainer.js')
}

const ipc = process.relieve.ipc

let cpuUsage

ipc.on('usage', function() {
  cpuUsage = process.cpuUsage(cpuUsage)

  ipc.send('usage', {
    cpu: cpuUsage,
    memory: process.memoryUsage()
  })
})
