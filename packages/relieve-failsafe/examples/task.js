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
