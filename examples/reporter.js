const rpReporter = require('../lib/nightwatch-reportportal-reporter');
const config = require('./rp');

module.exports = {
  write : (results, options, done) => rpReporter(results, config, done)
};