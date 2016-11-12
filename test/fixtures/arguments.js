
module.exports = {
  start: function() {
    process.relieve.ipc.send('arguments', process.relieve.argv)
  }
}
