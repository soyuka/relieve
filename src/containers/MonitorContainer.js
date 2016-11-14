if (!process.relieve) {
  require('./CallableContainer.js')
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
