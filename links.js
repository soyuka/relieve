var fs = require('fs')
var p = require('path')
var directories = ['containers', 'workers', 'tasks', 'strategies']

directories.forEach(function(d) {
  var path = p.resolve(__dirname, 'src', d)
  var dest = p.resolve(__dirname, d)

  try {
    fs.symlinkSync(path, dest, 'dir')
  } catch(e) {}
})
