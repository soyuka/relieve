const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const p = require('path')
const exists = require('@soyuka/exists')

function rotate(path, i = 0) {
  let ext = p.extname(path)
  let basename = p.basename(path)

  let newPath = p.join(p.dirname(path), basename + i + ext)

  return exists(newPath)
  .then((exists) => exists ? rotate(path, ++i) : fs.renameAsync(path, newPath))
}

module.exports = rotate
