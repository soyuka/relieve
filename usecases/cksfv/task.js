var channel
var readLine = require('./readLine.js')

module.exports = {
  setChannel: function(c) {
    channel = c 
  },
  readLine: function(path, line) {
    readLine(path, line)
    .then(function(resp) {
      channel.send('cksfv', resp) 
      process.exit(0)
    })
  }
}
