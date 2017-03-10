var fs = require('fs')
var p = require('path')
var directories = ['containers', 'workers', 'tasks', 'strategies']

directories.forEach(function(d) {
  var path = p.resolve(__dirname, 'src', d)
  var dest = p.resolve(__dirname, d)

  fs.access(dest, fs.constants.F_OK | fs.constants.R_OK, function(err) {
    if (!err) {
      fs.unlinkSync(dest)
    }

    fs.symlinkSync(path, dest, 'dir')
  })
})
