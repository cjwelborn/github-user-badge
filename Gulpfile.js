var buffer    = require('vinyl-buffer'),
    browserify= require('browserify'),
    gulp      = require('gulp'),
    gutil     = require('gulp-util'),
    minifyCss = require('gulp-minify-css'),
    source    = require('vinyl-source-stream'),
    uglify    = require('gulp-uglify');

gulp.task('css', function(){
  return gulp.src('*.css')
    .pipe(minifyCss({compatibility: 'ie8'}))
    .pipe(gulp.dest('dist'));
});


gulp.task('js', function(){
  var make = function(minify){
    var ext = (minify) ? '.min.js' : '.js';

    var b = browserify({
      entries: './badge.js',
      debug: true
    });

    var b = b.bundle()
      .pipe(source('badge'+ext))
      .pipe(buffer());
  
    if(minify) b = b.pipe(uglify());

    return b.on('error', gutil.log).pipe(gulp.dest('./dist/'));
  }

  return make() && make(true);
});

gulp.task('default', ['js', 'css']);
