module.exports = {
  interval: null,
  getMe: function(data) {
    return Promise.resolve(data)
  },
  callMe: function(data) {
    var self = this
    this.interval = setInterval(function() {
      process.relieve.ipc.send('working')
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
