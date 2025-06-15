// Set CHROME_BIN to the path provided by Puppeteer
process.env.CHROME_BIN = require("puppeteer").executablePath();

module.exports = function (config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    files: [],
    exclude: [],
    reporters: ["progress", "kjhtml"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ["Chrome", "ChromeHeadlessCI"],
    singleRun: true,
    concurrency: Infinity,
    customLaunchers: {
      ChromeHeadlessCI: {
        base: "ChromeHeadless",
        flags: ["--no-sandbox"],
      },
    },
    plugins: [
      require("karma-jasmine"),
      require("karma-chrome-launcher"),
      require("karma-jasmine-html-reporter"),
      require("@angular-devkit/build-angular"),
    ],
  });
};
