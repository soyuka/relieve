const TCPEE = require('tcpee')
const util = require('util')
const EE = require('events')

function TCPEEGroup(options) {
  if(!(this instanceof TCPEEGroup)) { return new TCPEEGroup(options) }

  this.options = options
  this.clients = new Map()

  EE.call(this, options)
}

util.inherits(TCPEEGroup, EE)

TCPEEGroup.prototype.add = function(sock) {
  let tcpee = new TCPEE(sock, this.options)

  tcpee.client.on('close', () => {
    this.clients.delete(tcpee.$TCPEE_IDENTITY)
  })

  tcpee.on('error', function(error, stack) {
    console.error(error, stack)
  })

  return new Promise((resolve, reject) => {
    tcpee.send('$TCPEE_IDENTITY')
    tcpee.once('$TCPEE_IDENTITY', (identity) => {
      tcpee.$TCPEE_IDENTITY = identity
      this.clients.set(identity, tcpee)
      this.emit('add', tcpee)
      resolve(tcpee)
    })
  })
}

TCPEEGroup.prototype.get = function(identity) {
  return this.clients.get(identity)
}

module.exports = TCPEEGroup
