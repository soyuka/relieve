const TCPEEServer = require('./tcpee/server')
const debug = require('debug')('relieve-failsafe:master')
const fs = require('fs')
const constants = require('./constants')

let server = null
let tcpeeGroup = null

;['SIGTERM', 'SIGINT'].map(e => {
  process.on(e, function() {
    process.exit()
  })
})

module.exports = function(options) {
  if (server !== null) {
    return Promise.resolve(tcpeeGroup)
  }

  options = constants(options)

  process.on('exit', function() {
    fs.writeFileSync(options.PERSISTENCE, tcpeeGroup === null ? 0 : tcpeeGroup.clients.size)
  })

  let num = 0

  try {
    num = fs.readFileSync(options.PERSISTENCE)
  } catch(e) {}

  return TCPEEServer(options, parseInt(num.toString()))
  .then((t, s) => {
    debug('master ready')
    tcpeeGroup = t
    server = s
    return Promise.resolve(tcpeeGroup)
  })
}
