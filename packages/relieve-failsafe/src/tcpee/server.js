const Server = require('net').Server
const fs = require('fs')
const existsSync = require('@soyuka/exists-sync')
const TCPEEGroup = require('./group')
const debug = require('debug')('relieve-failsafe:server')
const constants = require('../constants')
let connectionsNumber = 0
let timedOut = false
let timeout

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

module.exports = function(options, waitingForNumber = 0) {
  debug('Start server, waiting for %s customers', waitingForNumber)

  options = constants(options)

  //this has to block and throw if the socket is open
  if (existsSync(options.SOCKET)) {
    fs.unlinkSync(options.SOCKET)
  }

  process.on('exit', close(options.SOCKET))

  const server = new Server()
  server.listen(options.SOCKET)

  const tcpee = new TCPEEGroup(options)

  return new Promise((resolve, reject) => {
    function resolveFn() {
      resolve(tcpee)
    }

    server.on('listening', function() {
      server.on('connection', function(sock) {
        tcpee.add(sock)
        .then(() => {
          resetTimeout(options.TIMEOUT, resolveFn)
          if (timedOut === false && ++connectionsNumber >= waitingForNumber) {
            resolve(tcpee)
          }
        })
      })

      if (waitingForNumber === 0) {
        resolve(tcpee)
      } else {
        resetTimeout(options.TIMEOUT, resolveFn)
      }
    })
  })
}
