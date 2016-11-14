const Server = require('net').Server
const fs = require('fs')
const existsSync = require('@soyuka/exists-sync')
const TCPEEGroup = require('./group')
const debug = require('debug')('relieve-failsafe:server')
const constants = require('../constants')
let connectionsNumber = 0
let timedOut = false
let timeout
let tcpee = null
let server = null

function close(socketPath) {
  return function exit(e) {
    try {
      fs.unlinkSync(socketPath)
    } catch(e) {}

  }
}

function resetTimeout(time, resolveFn) {
  if (timeout) {
    clearTimeout(timeout)
  }

  timeout = setTimeout(function() {
    timedOut = true
    resolveFn()
  }, time)
}

function TCPEEServer(options, waitingForNumber = 0) {
  if (tcpee) {
    if (tcpee._ready === true) {
      return Promise.resolve(tcpee)
    }

    return new Promise((resolve) => {
      tcpee.once('ready', function() {
        resolve(tcpee)
      })
    })
  }

  debug('Start server, waiting for %s customers', waitingForNumber)

  options = constants(options)

  //this has to block and throw if the socket is open
  if (existsSync(options.SOCKET)) {
    fs.unlinkSync(options.SOCKET)
  }

  process.on('exit', close(options.SOCKET))

  server = new Server()
  server.listen(options.SOCKET)

  tcpee = new TCPEEGroup(options)

  return new Promise((resolve, reject) => {
    function resolveFn() {
      if (timeout) {
        clearTimeout(timeout)
      }

      tcpee.ready()
      resolve(tcpee)
    }

    server.on('listening', function() {
      server.on('connection', function(sock) {
        tcpee.add(sock)
        .then(() => {
          resetTimeout(options.TIMEOUT, resolveFn)
          if (timedOut === false && ++connectionsNumber >= waitingForNumber) {
            resolveFn()
          }
        })
      })

      if (waitingForNumber === 0) {
        resolveFn()
      } else {
        resetTimeout(options.TIMEOUT, resolveFn)
      }
    })
  })
}

TCPEEServer.close = function() {
  tcpee = null
}

module.exports = TCPEEServer
