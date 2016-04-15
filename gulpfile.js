'use strict';
var path = require('path');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');
var babel = require('gulp-babel');
var del = require('del');

gulp.task('default', function () {
    return gulp.src('src/**/*.js')
        .pipe(excludeGitignore())
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
        .pipe(babel())
        .pipe(gulp.dest("lib/"));
});

gulp.task('clean', function() {
    return del(['dist']);
});

