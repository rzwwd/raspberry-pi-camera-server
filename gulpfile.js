let source =            require('vinyl-source-stream');
let gulp =              require('gulp');
let browserify =        require('browserify');
let reactify =          require('reactify');
let babelify =          require('babelify');
let watchify =          require('watchify');
let imagemin =          require('gulp-imagemin');
let del =               require('del');
let useref =            require('gulp-useref');
let cssnano =           require('gulp-cssnano');
let minifyCSS =         require('gulp-minify-css');
let buffer =            require('vinyl-buffer');
let concatCSS =         require('gulp-concat-css');
let production = process.env.NODE_ENV === 'production';


gulp.task('default', ['clean', 'css', 'jsx'], function() {
    gulp.watch('dev/css/**', ['css']);
    gulp.watch('dev/js/**/*.js', ['jsx']);
});


gulp.task('build', ['clean', 'css', 'jsx'], function () {
    console.log("Successfully build");
});


gulp.task('css', function(){
    return gulp.src('dev/css/**/*.css')
        .pipe(useref())
        .pipe(concatCSS('style.min.css'))
        .pipe(minifyCSS())
        .pipe(gulp.dest('include/css'))
});
gulp.task('jsx', function(){
    let bundler = browserify(['./dev/js/index.js'], {basedir: __dirname, debug: production, modules: true});
    bundler.transform('babelify', {presets: ["es2015", "react"]});
    let stream = bundler.bundle();
    return stream
        .on('error', console.log.bind(console.description))
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./include/js'));
});


gulp.task('clean', function() {
    return del.sync('include/**');
});
