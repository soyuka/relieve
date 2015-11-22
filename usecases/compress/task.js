'use strict';
var archiver = require('archiver')
var fs = require('fs')
var channel

module.exports = {
  setChannel: function(channel) {
    var archive = archiver('zip')
    var action = process.argv[3]
    var output = fs.createWriteStream(action.dest)

    output.on('close', function() {
      channel.send('finish', archive.pointer() + ' bytes written') 
      process.exit(0) //Note that we exit this tasks when it's done
    })

    archive.on('error', function(err) { throw err })
    archive.pipe(output)
    archive.bulk([action.src])
    archive.finalize()
  }
}

