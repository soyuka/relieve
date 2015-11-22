var IPCEE = require('ipcee')

var ipc = IPCEE(process, {wildcard: false})

ipc.send('started')

ipc.on('ping', function() {
 ipc.send('pong') 
})

ipc.on('ping.me', function() {
 ipc.send('me.pong')
})

module.exports = {
  hello: function() {
    return 'world';
  },
  me: function() {
    ipc.send('calling') 
  }
}
