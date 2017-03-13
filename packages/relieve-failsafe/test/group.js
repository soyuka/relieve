const net = require('net')
const expect = require('chai').expect
const existsSync = require('@soyuka/exists-sync')
const fs = require('fs')
const TCPEEGroup = require('../src/tcpee/group')
const TCPEE = require('tcpee')

const os = require('os').platform()
const SOCKET = os === 'win32' ? `\\\\?\\pipe\\${__dirname}\\group.sock`: `${__dirname}/group.sock`

describe('group', function() {
  it('should add a tcpee', function(cb) {
    const group = new TCPEEGroup()
    let i = 0

    if (os !== 'win32' && existsSync(SOCKET)) {
      fs.unlinkSync(SOCKET)
    }

    let server = new net.Server()
    server.listen(SOCKET)

    group.on('$TCPEE_ADD:foo', function() {
      i++
    })

    server.on('connection', function(socket) {
      group.add(socket)
      .then(e => {
        expect(e).to.be.an.instanceof(TCPEE)

        expect(group.get('foo')).to.deep.equal(e)
        expect(i).to.equal(1)
        expect(group.clients.size).to.equal(1)

        cb()
      })
    })

    let socket = new net.Socket()
    let client = new TCPEE(socket)

    client.on('$TCPEE_IDENTITY', function() {
     client.send('$TCPEE_IDENTITY', 'foo')
    })

    socket.connect(SOCKET)
  })

  after(function() {
    if (os !== 'win32' && existsSync(SOCKET)) {
      fs.unlinkSync(SOCKET)
    }
  })
})
