var customVars = require('./gulp-custom-vars');
var gulp = require('gulp');
var gulpFlatten = require('gulp-flatten');
var sass = require('gulp-sass');
var sassLint = require('gulp-sass-lint');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var cache = require('gulp-cache');
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');
var log = require('fancy-log');
var colors = require('ansi-colors');
var notify = require('gulp-notify');
var child_process = require('child_process');
var fs = require('file-system');
var Crawler = require('simplecrawler');
var vnu = require('vnu-jar');
var argv = require('yargs').argv;
var babel = require("gulp-babel");

// Function to check for the existence of the Sass-lint config file.
function sassLintCheck() {
  try {
    fs.accessSync(customVars.sassLintConfigFile);
    runSassLint = true;
    log.info('Using sass-lint config file: ' + colors.magenta(customVars.sassLintConfigFile));
  } catch (err) {
    log.warn(colors.yellow.bold(`Warning: Sass-lint config file ${customVars.sassLintConfigFile} was not found. Sass-lint is disabled.`));
    return false;
  }
  return true;
};

gulp.task('serve', function() {

  browserSync.init({
    proxy: "localhost",
    // browser: "google chrome",
    // port: 8888,
    // browser: "safari"
    // browser: "FirefoxDeveloperEdition"
    // browser: "firefox"
    // reloadDelay: 2000
  });

  // if (customVars.domain == 'auto') {
  //   // Attempt to automatically get the domain name from Dev Desktop's config files.
  //   customVars.domain = require('gulp-getdevdesktopdomain');
  //   if (customVars.domain == null) {
  //     log.warn(colors.yellow.bold('Warning: Could not set BrowserSync domain name automatically.'));
  //     log.warn(colors.yellow.bold('  Manually set a domain name in gulpfile.js to use BrowserSync.'));
  //   } else {
  //     log.info('Found Dev Desktop domain: ' + colors.magenta(customVars.domain));
  //   }
  // }
  //
  // // Skip BrowserSync init if no domain is provided.
  // if (customVars.domain) {
  //   browserSync.init({
  //     proxy: customVars.domain,
  //     scrollRestoreTechnique: 'window.name'
  //     // browser:     "google chrome"
  //   });
  // }

  gulp.watch("src/**/*.scss").on('change', gulp.series(['sass-lint', 'sass', 'cacheRebuild', 'browserSyncReload']));
  gulp.watch(["src/**/*.twig", "includes/**/*.inc", "sass/**/*.twig"]).on('change', gulp.series(['cacheRebuild', 'browserSyncReload']));
  gulp.watch('src/**/*.js').on('change', gulp.series(['es6build', 'cacheRebuild', 'browserSyncReload']));
});

gulp.task('browserSyncReload', function() {
  return browserSync.reload();
});

gulp.task('sass-lint', function(done, err) {
  if (sassLintCheck()) {
    stream = gulp.src("src/**/*.scss")
      .pipe(plumber(function(error) {
        log.error(colors.red.bold('Error (' + error.plugin + '): ' + error.message));
        this.emit('end');
      }))
      .pipe(plumber({errorHandler: notify.onError("Error : <%= error.message %>")}))
      .pipe(sassLint({
        configFile: customVars.sassLintConfigFile
      }))
      .pipe(sassLint.format())
      .pipe(sassLint.failOnError());

    return stream;
  } else {
    return done(err);
  }
});

gulp.task('sass-lint-ci', function(cb) {
  if (sassLintCheck()) {
    child_process.exec("./node_modules/sass-lint/bin/sass-lint.js -v --max-warnings 0 -c " + customVars.sassLintConfigFile + " 'src/**/*.scss'", function(err, stdout) {
      log(colors.red.bold(stdout));
      cb();
    }).on('exit', exitCode => process.exitCode = exitCode);
  } else {
    cb('No sass-lint config file');
  }
});

gulp.task('sass', function() {
  stream = gulp.src("src/**/*.scss")
    .pipe(plumber(function(error) {
      log.error(colors.red.bold('Error (' + error.plugin + '): ' + error.message));
      this.emit('end');
    }))
    .pipe(plumber({errorHandler: notify.onError("Error : <%= error.message %>")}))
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.identityMap())
    .pipe(sass({
      outputStyle: 'expanded'
    }))
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer([
      'ie >= 10',
      'ie_mob >= 10',
      'ff >= 30',
      'chrome >= 28',
      'safari >= 5',
      'opera >= 23',
      'ios >= 6',
      'android >= 4.2',
    ], {
      grid: true
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("dist/css"));

  // Only add BrowserSync to the stream if a domain name is provided.
  if (customVars.domain) {
    stream = stream.pipe(
      browserSync.stream({
        stream: true
      })
    );
  }

  return stream;
});

// Use Babel to compile ES6 to ES5 (compatable with IE10+)
// Minify files after they are compiled
gulp.task("es6build", function () {
  stream = gulp.src("src/**/*.js")
    .pipe(babel())
    .pipe(gulpFlatten())
    .pipe(gulp.dest("dist/js"))
    return stream;
});

gulp.task('w3c-validate', function(done) {
  var siteToCrawl = argv.site;
  if (!siteToCrawl) {
    log.error(colors.red.bold('Use --site to declare the site to crawl.'));
    done();
    return -1;
  }

  // Start vnu validator server.
  vnuServer = child_process.spawn('java', [
      '-cp',
      vnu,
      'nu.validator.servlet.Main',
      '8888'
    ], {
    });

  var crawler = new Crawler(siteToCrawl);
  var violationsFound = 0;
  var maxPages = 100;
  var currentPageNum = 0;
  var killCrawler = function () {
    crawler.stop();
    vnuServer.kill();

    if (violationsFound > 0) {
      log.error(colors.red.bold('W3C violations found: ' + violationsFound));
      process.exitCode = 1;
    }

    done();
  }

  crawler.maxConcurrency = 8;
  crawler.interval = 250;
  crawler.maxDepth = 100;
  crawler.timeout = 60000;
  crawler.listenerTTL = 5000;
  crawler.ignoreInvalidSSL = true;
  crawler.respectRobotsTxt = false;

  // Skip files.
  crawler.addFetchCondition(function(queueItem, referrerQueueItem, callback) {
    callback(null, !queueItem.path.match(/\.[a-z]{3}(\?.*)?/i));
  });

  // Skip pages with query strings.
  crawler.addFetchCondition(function(queueItem, referrerQueueItem, callback) {
    callback(null, !queueItem.path.match(/\?.*=.*$/));
  });

  // Only download HTML pages.
  crawler.addDownloadCondition(function(queueItem, referrerQueueItem, callback) {
    if (queueItem.stateData.contentType) {
      if (queueItem.stateData.contentType.indexOf('text/html') == 0) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  });

  // Print the error message for 'fetchclienterror' events.
  crawler.on('fetchclienterror', function(queueItem, error) {
    log.error(colors.red.bold("Client error: " + error));

    if (siteToCrawl.indexOf('https') === 0) {
      log.error(colors.red.bold("THIS IS MOST LIKELY DUE TO AN INVALID SSL CERTIFICATE."));
      log.error(colors.red.bold("Try a http:// address instead."));
    }
  });

  // Print a message if the response timeout is exceeded.
  crawler.on('fetchtimeout', function(queueItem, responseBuffer, response) {
    log.warn(colors.yellow.bold("Timed out: " + queueItem.url));
  });

  // Run validator on page.
  crawler.on('fetchcomplete', function(queueItem, responseBuffer, response) {
    currentPageNum++;
    if (currentPageNum > maxPages) {
      // Empty out the queue.
      crawler.queue = new Crawler.queue()
    }

    log.info("Validating: " + colors.green(queueItem.url));
    vnuClientCmd = child_process.spawnSync('java', [
        '-cp',
        vnu,
        '-Dnu.validator.client.level=error',
        'nu.validator.client.HttpClient',
        '-'
      ], {
        input: responseBuffer.toString()
      });

    // Split validator output into an array of strings split at new lines.
    var lines = vnuClientCmd.output.toString().split('\n');
    lines.forEach(function(line) {
      var printLine = false;

      // Strip "[stdin]" from beginning of line.
      line = line.replace('"[stdin]"', '');

      // Only print errors.
      if (line.match(/^:[^:]*: error/)) {
        printLine = true;
      }

      // Some errors that we don't care about.
      if (line.match(/An "img" element must have an "alt" attribute/)) {
        printLine = false;
      }
      if (line.match(/Bad value "[^"]*" for attribute "rel" on element "link"/)) {
        printLine = false;
      }
      if (line.match(/The "frameborder" attribute on the "iframe"/)) {
        printLine = false;
      }
      if (line.match(/Attribute "about" not allowed on element "[^"]*" at this point./)) {
        printLine = false;
      }
      if (line.match(/Attribute "autocorrect" not allowed on element "input" at this point./)) {
        printLine = false;
      }

      if (printLine) {
        // Use console.log instead of fancy-log because we don't want
        // timestamps here.
        console.log(colors.red.bold(line));
        violationsFound++;
      }
    });

    // If the queue is empty then shut things down.
    if (crawler.queue.length == 0) {
      killCrawler();
    }
  });

  crawler.on('complete', function () {
    killCrawler();
  });

  // Watch for the VNU server availability.
  vnuServer.stderr.on('data', function (data) {
    if (data.toString().match(/INFO:oejs.Server:main: Started/)) {
      // Start the crawler.
      crawler.start();
    }
  });
});

gulp.task('clearDrupalCache', function(done) {
  drushCmd = 'drush cc render';

  if (customVars.environment == 'lando') {
    drushCmd = 'lando ' + drushCmd;
  }

  if (drushCmd) {
    child_process.exec(drushCmd, function (err, stdout, stderr) {
      log(stdout);
      log(stderr);
      done();
    });
  }
});

gulp.task('cacheRebuild', function(done) {
  drushCmd = 'drush cr';

  if (customVars.environment == 'lando') {
    drushCmd = 'lando ' + drushCmd;
  }

  if (drushCmd) {
    child_process.exec(drushCmd, function (err, stdout, stderr) {
      log(stdout);
      log(stderr);
      done();
    });
  }
});

gulp.task('default', gulp.series(['sass-lint', 'sass', 'serve']));
gulp.task('sass-lint-ci', gulp.series(['sass-lint-ci']));
gulp.task('w3c-validate', gulp.series(['w3c-validate']));
