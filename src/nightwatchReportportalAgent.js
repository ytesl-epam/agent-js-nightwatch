const _ = require('lodash');
const moment = require('moment');
const RPClient = require('reportportal-client');
const statuses = require('./constants/statuses');
const logLevels = require('./constants/logLevels');
const testItemTypes = require('./constants/testItemTypes');
const actionTypes = require('./constants/actionTypes');

class NightwatchAgent {
  constructor({ launchParams, ...clientConfig }) {
    this.client = new RPClient(clientConfig);
    this.launchParams = launchParams;
  }

  startReporting(results, done) {
    this.client.checkConnect()
      .then(() => this.report(results, done))
      .catch((e) => this.finalize(done, { status: statuses.FAILED }, e));
  };

  report(results, done) {
    const tests = this.collectItems(results);
    const endTime = _.last(tests).endTime;

    this.reportItems(tests);
    this.finalize(done, { endTime });
  };

  reportItems(items) {
    let startTime = _.first(items).startTime;

    this.launchId = this.client.startLaunch({
      startTime,
      ...this.launchParams,
    }).tempId;

    let stepsTempIds = [this.launchId];

    items.forEach(({ action, ...item } = {}) => {
      switch (action) {
        case actionTypes.START_TEST_ITEM:
          let stepObj = this.client.startTestItem(item, ...stepsTempIds);
          stepsTempIds.push(stepObj.tempId);
          break;
        case actionTypes.FINISH_TEST_ITEM:
          this.client.finishTestItem(stepsTempIds.pop(), item);
          break;
        case actionTypes.SEND_LOG:
          this.client.sendLog(_.last(stepsTempIds), item);
      }
    });
  };

  collectItems(results) {
    const items = [];
    const suiteNames = Object.keys(results.modules);

    for (const suiteName of suiteNames) {
      const suite = results.modules[suiteName];
      const suiteStartTime = new Date(suite.timestamp);
      const suiteEndTime = moment(suiteStartTime).add(suite.time, 's').toDate();

      items.push({
        action: actionTypes.START_TEST_ITEM,
        name: suiteName,
        attributes: [{ value: suite.group }],
        startTime: suiteStartTime,
        type: testItemTypes.SUITE,
      });

      const tests = { ...suite.completed };
      if (suite.skipped.length) {
        suite.skipped.forEach((itemName) => {
          tests[itemName] = {
            name: itemName,
            status: statuses.SKIPPED,
          };
        });
      }
      const testNames = Object.keys(tests);
      let testStartTime = suiteStartTime;

      for (const testName of testNames) {
        const test = tests[testName];

        items.push({
          action: actionTypes.START_TEST_ITEM,
          name: testName,
          startTime: testStartTime,
          type: testItemTypes.STEP,
        });

        testStartTime = moment(testStartTime).add(test.timeMs, 'ms').toDate();
        const status = test.status ? test.status : test.failed ? statuses.FAILED : statuses.PASSED;

        if (test.stackTrace) {
          items.push({
            action: actionTypes.SEND_LOG,
            level: logLevels.ERROR,
            time: testStartTime,
            message: test.stackTrace
          });
        }

        (test.failed || test.errors) && test.assertions.forEach((assertion) => {
          items.push({
            action: actionTypes.SEND_LOG,
            level: logLevels.INFO,
            time: testStartTime,
            message: assertion.message
          });
          assertion.failure && items.push({
            action: actionTypes.SEND_LOG,
            level: logLevels.DEBUG,
            time: testStartTime,
            message: assertion.failure
          });
          assertion.stackTrace &&
          items.push({
            action: actionTypes.SEND_LOG,
            level: logLevels.TRACE,
            time: testStartTime,
            message: assertion.stackTrace
          });
        });

        items.push({
          action: actionTypes.FINISH_TEST_ITEM,
          endTime: testStartTime,
          status
        });
      }

      items.push({
        action: actionTypes.FINISH_TEST_ITEM,
        endTime: suiteEndTime,
      });
    }

    return items;
  };

  finalize(done, params, error) {
    if (this.launchId) {
      this.client.finishLaunch(this.launchId, params);
    }
    done(error);
  };

}

module.exports = NightwatchAgent;
