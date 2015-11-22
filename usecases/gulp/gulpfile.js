var gulp = require('gulp')

gulp.task('foo', function() {
  console.log('hello');
  return Promise.resolve()
})

gulp.task('bar', function() {
  console.log('world');
  return Promise.resolve()
})

gulp.task('default', ['foo', 'bar'])
