var gulp = require('gulp'),
    eslint = require('gulp-eslint'),
    mocha = require('gulp-mocha');

gulp.task('lint', function () {
    return gulp
        .src(['./src/*.js', './bin/*.js', './src/tests/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});

gulp.task('test', ['lint'], function () {
    return gulp
        .src('./tests/*.js', {read: false})
        .pipe(mocha());
});

gulp.task('watch', function () {
    gulp.watch([
        './src/**/*',
        './bin/**/*',
        './tests/**/*',
        './package.json'
    ], ['test']);
});
