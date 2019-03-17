var gulp = require('gulp'),
    sass = require('gulp-dart-sass'),
    postcss = require('gulp-postcss'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    merge = require('merge-stream'),
    foreach = require('gulp-flatmap'),
    changed = require('gulp-changed'),
    browserSync = require('browser-sync').create(),
    wpPot = require('gulp-wp-pot'),
    cssnano = require('cssnano'),
    cmq = require('css-mqpacker'),
    autoprefixer = require('autoprefixer');

var plugins = [
    autoprefixer,
    cssnano,
    cmq
]

var paths = {
    styles: {
        src: 'assets/scss/style.scss',
        dest: 'assets/css'
    },
    scripts: {
        src: [
            'assets/js/source/app.js',
            'node_modules/jquery/dist/jquery.slim.js',
            'node_modules/bootstrap/dist/js/bootstrap.js',
            'node_modules/popper.js/dist/umd/popper.js',
            'node_modules/smartmenus/dist/jquery.smartmenus.js',
            'node_modules/smartmenus-bootstrap-4/jquery.smartmenus.bootstrap-4.js'
        ],
        dest: 'assets/js'
    },
    languages: {
        src: '**/*.php',
        dest: 'languages/bootstrap-for-genesis.pot'
    },
    site: {
        url: 'http://bootstrap.test'
    }
}

function translation() {
    return gulp.src(paths.languages.src)
        .pipe(wpPot())
        .pipe(gulp.dest(paths.languages.dest))
}

function scriptsLint() {
    return gulp.src('assets/js/source/**/*','gulpfile.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
}

function style() {
    var cssStream = gulp.src('node_modules/smartmenus-bootstrap-4/jquery.smartmenus.bootstrap-4.css')
        .pipe(concat('smartmenus.css'));
    
    var sassStream = gulp.src(paths.styles.src)
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(concat('app.scss'));
    
    var mergeStream = merge(sassStream, cssStream)
        .pipe(changed(paths.styles.dest))
        .pipe(concat('app.css'))
        .pipe(postcss(plugins))
        .pipe(rename('app.css'))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(browserSync.stream())
        .pipe(notify({ message: 'Styles task complete' }));
    
    return mergeStream;
}

function js() {
    return gulp.src(paths.scripts.src)
    .pipe(changed(paths.scripts.dest))
    .pipe(foreach(function(stream, file){
        return stream
            .pipe(uglify())
            .pipe(rename({suffix: '.min'}))
    }))
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(browserSync.stream({match: '**/*.js'}))
    .pipe(notify({ message: 'Scripts task complete' }));
}

function browserSyncServe(done) {
    browserSync.init({
        injectChanges: true,
        proxy: paths.site.url
    })
    done();
}

function browserSyncReload(done) {
    browserSync.reload();
    done();
}

function watch() {
    gulp.watch(['assets/scss/*.scss', 'assets/scss/**/*.scss'], style).on('change', browserSync.reload)
    gulp.watch(paths.scripts.src, gulp.series(scriptsLint, js))
    gulp.watch([
            '*.php',
            'lib/*'
        ],
        gulp.series(browserSyncReload)
    )
}

gulp.task('translation', translation);

gulp.task('default', gulp.parallel(style, js, browserSyncServe, watch));