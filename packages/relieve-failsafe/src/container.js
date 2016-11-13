const Socket = require('net').Socket
const TCPEE = require('tcpee')
const startedAt = Date.now()

require('relieve/containers/ArgumentsContainer')

let interval
function connect() {
  socket.connect(process.relieve.containerArgs.socket)
}

const socket = new Socket({allowHalfOpen: true})

socket.on('error', function(e) {
  if (e.code === 'ENOENT') {
    setTimeout(connect, 1000)
  }
})

socket.on('end', function() {
  interval = process.nextTick(connect)
})

connect()

const ipc = new TCPEE(socket, process.relieve.containerArgs.eventemitter)

process.relieve.ipc = ipc

ipc.on('startedAt', function() {
 ipc.send('startedAt', startedAt)
})

ipc.on('$TCPEE_IDENTITY', function() {
  ipc.send('$TCPEE_IDENTITY', process.relieve.argv[0])
})

ipc.on('$TCPEE_KILL', function(signal) {
  process.kill(process.pid, signal)
})

process.on('exit', function(code) {
	ipc.send('$TCPEE_EXIT', code)

  process.nextTick(e => process.exit(code))
})

;['SIGTERM', 'SIGINT'].map(e => {
  process.on(e, process.exit)
})

require('relieve/containers/ScriptContainer')
