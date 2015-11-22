
module.exports = {
  setChannel: function(channel) {
    channel.send('arguments', process.argv)
  }
}
