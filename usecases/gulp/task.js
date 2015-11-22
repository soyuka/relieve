var gulp = require('gulp')
require(require('path').resolve(process.cwd(), 'gulpfile.js'))
gulp.start(process.argv[3], function() {
  process.exit(0)
})
