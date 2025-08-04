const { src, dest, series, parallel, watch } = require('gulp');
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
const terser = require('gulp-terser');
const imagemin = require('gulp-imagemin');
const del = require('del');
const browserSync = require('browser-sync').create();
const { spawn } = require('child_process');

function clean() {
  return del(['dist']);
}

function html() {
  return src('dev/**/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest('dist'));
}

function styles() {
  return src('dev/**/*.css')
    .pipe(cleanCSS())
    .pipe(dest('dist'));
}

function scripts() {
  return src('dev/**/*.js')
    .pipe(terser())
    .pipe(dest('dist'));
}

function images() {
  return src('dev/**/*.{png,jpg,jpeg,gif,svg,ico}')
    .pipe(imagemin())
    .pipe(dest('dist'));
}

function fonts() {
  return src('dev/**/*.{eot,svg,ttf,woff,woff2}')
    .pipe(dest('dist'));
}

function serve() {
  browserSync.init({
    server: { baseDir: 'dev' }
  });

  watch('dev/**/*').on('change', browserSync.reload);
}

function firebaseDeploy(done) {
  const cmd = spawn('firebase', ['deploy', '--only', 'hosting'], { stdio: 'inherit' });
  cmd.on('close', done);
}

const build = series(clean, parallel(html, styles, scripts, images, fonts));

exports.clean = clean;
exports.build = build;
exports.deploy = series(build, firebaseDeploy);
exports.local = serve;
