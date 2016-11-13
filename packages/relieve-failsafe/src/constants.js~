const tmpdir = require('os').tmpdir()
const extend = require('util')._extend
const constants = {
  SOCKET: `${tmpdir}/relieve.sock`,
  //this keeps a number of alive sockets in case of failure wait until they come back or timeout
  PERSISTENCE: `${tmpdir}/relieve.count`,
  TIMEOUT: 5000 //timeout to wait before resolving the tcpee group
}

module.exports = function(options) {
  return extend(constants, options)
}
