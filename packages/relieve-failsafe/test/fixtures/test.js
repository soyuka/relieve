let ipc = process.relieve.ipc

console.log('alive');
ipc.on('foo', function() {
  console.log('got foo test.js');
  ipc.send('foo')
})
