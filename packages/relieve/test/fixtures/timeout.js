const ipc = process.relieve.ipc

setTimeout(function() {
  ipc.send('response', 'ok')
  process.exit(0)
}, 200)
