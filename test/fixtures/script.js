module.exports = {
  interval: null,
  setChannel: function(channel) {
    this.channel = channel 
  },
  getMe: function(data) {
    return Promise.resolve(data)
  },
  callMe: function(data) {
    var self = this
    this.interval = setInterval(function() {
      self.channel.send('working')
    })
  },
  stopMe: function() {
    clearInterval(this.interval)
    return Promise.resolve(true)
  },
  throw: function() {
    throw new Error('Fail')
  },
  name: 'script'
}
