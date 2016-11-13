const net = require('net')
const TCPEEServer = require('../src/tcpee/server')
const TCPEEGroup = require('../src/tcpee/group')
const TCPEE = require('tcpee')
const expect = require('chai').expect
const existsSync = require('@soyuka/exists-sync')
const fs = require('fs')

describe('server', function() {

  it('should start without waiting for connections', function(cb) {
    TCPEEServer({SOCKET: './server.sock'})
    .then(tcpeeGroup => {
      expect(tcpeeGroup).to.be.an.instanceof(TCPEEGroup)
      expect(tcpeeGroup.clients.size).to.equal(0)
      cb()
    })
  })

  it('should wait for a socket entry before resolving', function(cb) {
    TCPEEServer({SOCKET: './server.sock'}, 1)
    .then(tcpeeGroup => {
      expect(tcpeeGroup).to.be.an.instanceof(TCPEEGroup)
      expect(tcpeeGroup.get('foo')).to.be.an.instanceof(TCPEE)
      expect(tcpeeGroup.clients.size).to.equal(1)
      cb()
    })

    let socket = new net.Socket()
    let client = new TCPEE(socket)

    client.on('$TCPEE_IDENTITY', function() {
     client.send('$TCPEE_IDENTITY', 'foo')
    })

    function connect() {
      socket.connect('./server.sock')
    }

    connect()
  })

  it('should timeout because socket is not there', function(cb) {
    TCPEEServer({SOCKET: './server.sock', TIMEOUT: 100}, 1)
    .then(tcpeeGroup => {
      expect(tcpeeGroup).to.be.an.instanceof(TCPEEGroup)
      expect(tcpeeGroup.clients.size).to.equal(0)
      cb()
    })
  })

  after(function() {
    if (existsSync('./server.sock')) {
      fs.unlinkSync('./server.sock')
    }
  })
})
