var gulp = require('gulp')
  , bower = require('gulp-bower');

gulp.task('bower', function() {
  return bower()
    .pipe(gulp.dest('lib/'))
});
