var IPCEE = require('ipcee')
var channel = IPCEE(process)
setTimeout(function() {
  channel.send('response', 'ok')
  process.exit(0)
}, 200)
