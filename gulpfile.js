// ////////////////////////////////////////////
// 操作流程如下：
// ##監控開發中##
// gulp watch
// ##產出##
// gulp (default)
// ##佈署並加上版號##
// gulp build:copy
// gulp build:release
// ------------------
// 2015.08.06重置
// ------------------
// ##.gitignore##
// /public/*.html
// /public/styles
// /public/scripts
// /public/css
// /public/js
// /public/fonts
// /public/images
// /public/bower_components
// /node_modules
// .bundle
// .sass-cache
// .tmp
// .DS_Store
// Thumbs.db
// ////////////////////////////////////////////
var gulp         = require('gulp'),
    // General Part
    plumber      = require('gulp-plumber'),
    size         = require('gulp-size'),
    rename       = require('gulp-rename'),
    del          = require('del'),
    // CSS Part
    sass         = require('gulp-sass'),
    sourcemaps   = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    compass      = require('gulp-compass'),
    minifyCss    = require('gulp-minify-css'),
    // HTML Part
    jade         = require('gulp-jade'),
    // Javascript Part
    jshint       = require('gulp-jshint'),
    uglify       = require('gulp-uglify'),
    // Images Part
    cache        = require('gulp-cache'),
    imagemin     = require('gulp-imagemin'),
    // Library Part
    mainBowerFiles = require('main-bower-files'),
    // Sync-device
    browserSync  = require('browser-sync'),
    reload       = browserSync.reload,
    // Develop Part
    del          = require('del'),
    runSequence  = require('run-sequence'),
    // Build Part
    gulpif       = require('gulp-if'),
    rev          = require('gulp-rev'),
    revReplace   = require('gulp-rev-replace'),
    useref       = require('gulp-useref'),
    saveLicense  = require('uglify-save-license');

// *********************
// Templates Task
// *********************
gulp.task('views:develop', function() {
    gulp.src('assets/templates/*.jade')
        .pipe(plumber())
        .pipe(jade({ pretty: true }))
        .pipe(gulp.dest('public'))
        .pipe(size({ title: 'views:develop' }))
        .pipe(reload({stream: true}));
});

// *********************
// Styles Task with Compass / Sass
// *********************
gulp.task('styles', function (){
    gulp.src('assets/styles/**/*.scss')
        .pipe(plumber())
        .pipe(compass({
          css: 'public/styles',
          sass: 'assets/styles',
          sourcemap: true,
          style: 'expanded',
          comments: false,
          require: ['susy']
        }))
        .pipe(autoprefixer('last 2 version'))
        .pipe(size({ title: 'styles' }))
        .pipe(reload({stream: true}));
        // .pipe(gulp.dest('public/css')); 不能加入這行，會覆蓋compass的sourcemap路徑
});

// Styles Task without compass
// Uglifies
// gulp.task('styles', function () {
//     gulp.src('assets/styles/**/*.scss')
//         .pipe(plumber())
//         .pipe(sourcemaps.init())
//         .pipe(sass({
//           outputStyle: 'compressed'
//         }))
//         .pipe(autoprefixer('last 2 version'))
//         .pipe(sourcemaps.write('.'))
//         .pipe(gulp.dest('public/styles'))
//         .pipe(size({ title: 'styles' }));
// });

// *********************
// Scripts Task
// *********************
gulp.task('scripts', function() {
    gulp.src(['assets/scripts/**/*.js', '!assets/scripts/**/*.min.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(plumber())
        .pipe(gulp.dest('public/scripts'))
        .pipe(size({ title: 'scripts' }))
        .pipe(reload({stream: true}));
});

// *********************
// Image Task
// *********************
gulp.task('images', function () {
    return gulp.src('assets/images/**/*')
        .pipe(plumber())
        .pipe(cache(imagemin({
            optimizationLevel: 5,
            progressive: true,
            interlaced: true
        })))
        .pipe(size({title: 'images'}))
        .pipe(gulp.dest('public/images'))
        .pipe(reload({stream: true}));
});

// *********************
// Library Task
// *********************
gulp.task('libs', function () {
    return gulp.src(mainBowerFiles(), {
          base: 'bower_components'
        })
        .pipe(gulp.dest('public/libs'))
        .pipe(size({ title: 'libs' }));
})

// *********************
// BreowserSync Task
// *********************
gulp.task('browser-sync', function () {
    browserSync({
      server: {
        baseDir: "./public/"
      }
    })
});

// *********************
// 清除編譯中的檔案與快取
// *********************
gulp.task('clean:develop', function (cb) {
    del([
        'public/**/*.html',
        'public/styles',
        'public/scripts',
        'public/images',
        'public/libs',
        '.sass-cache'
    ], cb);
});

// *********************
// 建立平行開發環境
// *********************
gulp.task('prepare:develop', function (cb) {
    runSequence(
        'clean:develop',
        [
            'views:develop',
            'styles',
            'scripts',
            'images',
            'libs'
        ],
    cb);
});

// *********************
// 清除圖檔快取
// *********************
gulp.task('clean:cache', function (cb) {
  return cache.clearAll(cb);
})

// *********************
// 打包生產原始碼
// *********************
gulp.task('views:build',['scripts', 'styles', 'views:develop', 'images', 'libs']);

// *********************
// 建置前先清除舊資料
// *********************
gulp.task('clean:temporary', ['clean:develop', 'clean:cache'], function(cb) {
    del([
        'public/styles',
        'public/scripts',
        'public/images',
        'public/libs'
    ], cb);
});

// *********************
// Watch Task｜ 監看檔案狀態
// *********************
gulp.task('watch', ['prepare:develop'], function() {
    gulp.start('browser-sync');
    gulp.watch('assets/templates/**/*.jade', ['views:develop']);
    gulp.watch('assets/styles/**/*.scss', ['styles']);
    gulp.watch('assets/scripts/**/*.js', ['scripts']);
    gulp.watch('assets/images/**/*', ['images']);
});

// *********************
// Default Task | 佈署前的 Preview
// *********************
gulp.task('default', function(cb) {
    runSequence(
        'clean:temporary',
        'views:build',
    cb);
});

// *********************
// 清理編輯過程中的暫存檔
// *********************
gulp.task('clean:build', function (cb) {
    del([
        'build/styles',
        'build/scripts',
        'build/libs',
    ], cb);
});

// *********************
// 複製佈署並加上版本編號
// *********************
gulp.task('build:copy', function () {
    return gulp.src('public/**/*')
      .pipe(gulp.dest('build/'));
});
gulp.task('build:release', function () {
    var assets = useref.assets();
    return gulp.src('build/*.html')
      .pipe(assets)
      .pipe(gulpif('*.js', uglify({ preserveComments: saveLicense })))
      .pipe(gulpif('*.css', minifyCss()))
      .pipe(rev())
      .pipe(assets.restore())
      .pipe(useref())
      .pipe(revReplace())
      .pipe(size({title: 'full'}))
      .pipe(gulp.dest('build'));
});
// *********************
// 完全佈署
// *********************
gulp.task('build', function(callback) {
  runSequence(
    'build:copy',
    'build:release',
    'clean:build',
    callback);
});