const { src, dest, series, parallel, watch } = require("gulp");
const uglify = require("gulp-uglify");
const gulpif = require("gulp-if");
const cleanCSS = require("gulp-clean-css");
const del = require("delete");
const concat = require("gulp-concat");
const esbuild = require("esbuild");
const through2 = require("through2");
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;

const production = process.env.NODE_ENV === "production";
const pkg = require("./package.json");
const banner = `/*! @preserve
 * ${pkg.name}  
 * version: ${pkg.version}
 * https://github.com/mengshukeji/Luckysheet
 */`;

const uglifyOptions = {
  compress: {
    drop_console: true,
  },
};

const paths = {
  staticHtml: ["src/*.html"],
  staticFonts: ["src/fonts/**"],
  staticAssets: ["src/assets/**"],
  staticImages: ["src/plugins/images/*.png"],
  staticExpendPlugins: [
    "src/expendPlugins/**",
    "!src/expendPlugins/**/plugin.js",
  ],
  staticDemoData: ["src/demoData/*.js"],
  staticCssImages: ["src/css/**", "!src/css/*.css"],
  destStaticHtml: ["../public/lib"],
  destStaticFonts: ["./libs/dist/fonts"],
  destStaticAssets: ["./libs/dist/assets"],
  destStaticImages: ["./libs/dist/plugins/images"],
  destStaticExpendPlugins: ["./libs/dist/expendPlugins"],
  destStaticDemoData: ["./libs/dist/demoData"],
  destStaticCssImages: ["./libs/dist/css"],
  core: [
    "src/**/*.js",
    "!src/demoData/*.js",
    "src/expendPlugins/**/plugin.js",
    "!src/plugins/js/*.js",
  ],
  pluginsCss: ["src/plugins/css/*.css"],
  plugins: ["src/plugins/*.css"],
  css: ["src/css/*.css", "node_modules/flatpickr/dist/themes/light.css"],
  pluginsJs: [
    "node_modules/jquery/dist/jquery.min.js",
    "src/plugins/js/spectrum.min.js",
    "src/plugins/js/jquery-ui.min.js",
    "src/plugins/js/jquery.mousewheel.min.js",
    "src/plugins/js/jquery.sPage.min.js",
  ],
  concatPluginsCss: "pluginsCss.css",
  concatPlugins: "plugins.css",
  concatCss: "luckysheet.css",
  concatPluginsJs: "plugin.js",
  destPluginsCss: ["./libs/dist/plugins/css"],
  destPlugins: ["./libs/dist/plugins"],
  destCss: ["./libs/dist/css"],
  destPluginsJs: ["./libs/dist"],
  dist: "./libs/dist",
};

function clean() {
  return del([paths.dist], { force: true });
}

function pluginsJs() {
  return src(paths.pluginsJs)
    .pipe(concat(paths.concatPluginsJs))
    .pipe(gulpif(production, uglify(uglifyOptions)))
    .pipe(dest(paths.destPluginsJs))
    .pipe(through2.obj(function (file, _, cb) {
      if (file.isBuffer()) {
        this.push(file.contents.toString());
      }
      cb();
    }));
}


// Monitoring file changes
function watcher(done) {
  watch(paths.core, { delay: 500 }, series(core, reloadBrowser));

  // watch plugins and css
  watch(paths.pluginsCss, { delay: 500 }, series(pluginsCss, reloadBrowser));
  watch(paths.plugins, { delay: 500 }, series(plugins, reloadBrowser));
  watch(paths.css, { delay: 500 }, series(css, reloadBrowser));
  watch(paths.pluginsJs, { delay: 500 }, series(pluginsJs, reloadBrowser));

  // watch static
  watch(paths.staticHtml, { delay: 500 }, series(copyStaticHtml, reloadBrowser));
  watch(paths.staticFonts, { delay: 500 }, series(copyStaticFonts, reloadBrowser));
  watch(paths.staticAssets, { delay: 500 }, series(copyStaticAssets, reloadBrowser));
  watch(paths.staticImages, { delay: 500 }, series(copyStaticImages, reloadBrowser));
  watch(paths.staticExpendPlugins, { delay: 500 }, series(copyStaticExpendPlugins, reloadBrowser));
  watch(paths.staticDemoData, { delay: 500 }, series(copyStaticDemoData, reloadBrowser));
  watch(paths.staticCssImages, { delay: 500 }, series(copyStaticCssImages, reloadBrowser));

  done();
}

// Refresh browser
function reloadBrowser(done) {
  reload();

  done();
}

async function core(pluginsJsContent) {
  try {
    if (!production) {
      esbuild.build({
        format: "esm",
        globalName: "luckysheet",
        entryPoints: ["src/index.js"],
        bundle: true,
        minify: false,
        banner: { js: pluginsJsContent + '\n' + banner },
        target: ["es2018"],
        sourcemap: false,
        outfile: "./libs/dist/luckysheet.js",
      });
    } else {
      esbuild.build({
        format: "esm",
        globalName: "luckysheet",
        entryPoints: ["src/index.js"],
        bundle: true,
        drop: ['console', 'debugger'],
        banner: { js: pluginsJsContent + '\n' + banner },
        target: ["es2018"],
        sourcemap: false,
        outfile: "./libs/dist/luckysheet.js",
      });
    }
  } catch (error) {
    console.error("Error occurred during coreTask:", error);
  }
}

function pluginsCss() {
  return src(paths.pluginsCss)
    .pipe(concat(paths.concatPluginsCss))
    .pipe(gulpif(production, cleanCSS()))
    .pipe(dest(paths.destPluginsCss));
}

function plugins() {
  return src(paths.plugins)
    .pipe(concat(paths.concatPlugins))
    .pipe(gulpif(production, cleanCSS()))
    .pipe(dest(paths.destPlugins));
}

function css() {
  return src(paths.css)
    .pipe(concat(paths.concatCss))
    .pipe(gulpif(production, cleanCSS()))
    .pipe(dest(paths.destCss));
}

function copyStaticHtml() {
  return src(paths.staticHtml).pipe(dest(paths.destStaticHtml));
}

function copyStaticFonts() {
  return src(paths.staticFonts).pipe(dest(paths.destStaticFonts));
}

function copyStaticAssets() {
  return src(paths.staticAssets).pipe(dest(paths.destStaticAssets));
}

function copyStaticImages() {
  return src(paths.staticImages).pipe(dest(paths.destStaticImages));
}

function copyStaticExpendPlugins() {
  return src(paths.staticExpendPlugins).pipe(dest(paths.destStaticExpendPlugins));
}

function copyStaticDemoData() {
  return src(paths.staticDemoData).pipe(dest(paths.destStaticDemoData));
}

function copyStaticCssImages() {
  return src(paths.staticCssImages).pipe(dest(paths.destStaticCssImages));
}

const dev = series(
  clean,
  parallel(
    pluginsCss,
    plugins,
    css,
    pluginsJs,
    copyStaticHtml,
    copyStaticFonts,
    copyStaticAssets,
    copyStaticImages,
    copyStaticExpendPlugins,
    copyStaticDemoData,
    copyStaticCssImages,
    core,
  ),
  watcher,
);

const build = series(
  clean,
  parallel(
    pluginsCss,
    plugins,
    css,
    pluginsJs,
    copyStaticHtml,
    copyStaticFonts,
    copyStaticAssets,
    copyStaticImages,
    copyStaticExpendPlugins,
    copyStaticDemoData,
    copyStaticCssImages,
    function (done) {
      pluginsJs().on('data', function (pluginsJsContent) {
        core(pluginsJsContent);
        done();
      });
    }
  )
);

exports.dev = dev;
exports.build = build;
exports.default = dev;