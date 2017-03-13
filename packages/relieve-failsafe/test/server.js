const net = require('net')
const TCPEEServer = require('../src/tcpee/server')
const TCPEEGroup = require('../src/tcpee/group')
const TCPEE = require('tcpee')
const expect = require('chai').expect
const existsSync = require('@soyuka/exists-sync')
const fs = require('fs')

const os = require('os').platform()
const SOCKET = os === 'win32' ? `\\\\?\\pipe\\${__dirname}\\server.sock`: `${__dirname}/server.sock`

describe('server', function() {

  afterEach(function() {
    return TCPEEServer.close()
  })

  it('should start without waiting for connections', function(cb) {
    TCPEEServer({SOCKET: SOCKET})
    .then(tcpeeGroup => {
      expect(tcpeeGroup).to.be.an.instanceof(TCPEEGroup)
      expect(tcpeeGroup.clients.size).to.equal(0)

      cb()
    })
  })

  it('should wait for a socket entry before resolving', function(cb) {
    TCPEEServer({SOCKET: SOCKET}, 1)
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
      socket.connect(SOCKET)
    }

    connect()
  })

  it('should timeout because socket is not there', function(cb) {
    TCPEEServer({SOCKET: SOCKET, TIMEOUT: 100}, 1)
    .then(tcpeeGroup => {
      expect(tcpeeGroup).to.be.an.instanceof(TCPEEGroup)
      expect(tcpeeGroup.clients.size).to.equal(0)
      cb()
    })
  })

  after(function() {
    if (os !== 'win32' && existsSync(SOCKET)) {
      fs.unlinkSync(SOCKET)
    }
  })
})
