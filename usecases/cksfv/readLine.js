var Promise = require('bluebird')
var crc = require('crc')
var fs = Promise.promisifyAll(require('fs'))
var p = require('path')

function readLine(path, line) {
  if(!line.trim())
    return Promise.resolve()

  var original = line.trim().slice(-8)
  var filepath = line.slice(0, -9).trim()
  var resp = {original: original, filepath: filepath}

  console.log('Processsing %s', p.resolve(p.dirname(path), filepath))

  return fs.readFileAsync(p.resolve(p.dirname(path), filepath))
  .then(function(buffer) {
    var str = crc.crc32(buffer).toString(16)

    while(str.length < 8) {
      str = '0'+str 
    }
  
    resp.calculate = str

    return resp
  })
}

module.exports = readLine
