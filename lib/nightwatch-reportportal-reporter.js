const _ = require('lodash');
const moment = require('moment');
const RPClient = require('reportportal-client');

module.exports = (results, options, done) => {
  const rpClient = new RPClient(options);
  let tempId;
  let end_time;

  const finalize = (error) => {
    rpClient.finishLaunch(tempId, error ? { status: 'failed' } : { end_time });
    done(error)
  };

  rpClient.checkConnect()
    .then((response) => {

      // Parse Response
      const steps = [];
      const suiteNames = Object.keys(results.modules);

      for (const suiteName of suiteNames) {
        const suite = results.modules[suiteName];
        const suiteStartTime = new Date(suite.timestamp);
        const suiteEndTime = moment(suiteStartTime).add(suite.time, 's').toDate();

        steps.push({
          action: 'startTestItem',
          name: suiteName,
          tags: [suite.group],
          start_time: suiteStartTime,
          type: "SUITE"
        });

        const testNames = Object.keys(suite.completed);
        let testStartTime = suiteStartTime;

        for (const testName of testNames) {
          const test = suite.completed[testName];

          steps.push({
            action: 'startTestItem',
            name: testName,
            start_time: testStartTime,
            type: "TEST"
          });

          testStartTime = moment(testStartTime).add(test.timeMs, 'ms').toDate();
          const status = test.skipped ? "SKIPPED" : test.failed ? "FAILED" : "PASSED";

          if (test.stackTrace) {
            steps.push({
              action: 'sendLog',
              level: "TRACE",
              time: testStartTime,
              message: test.stackTrace
            });
          }

          (test.failed || test.errors) && test.assertions.forEach((assertion) => {
            steps.push({
              action: 'sendLog',
              level: "INFO",
              time: testStartTime,
              message: assertion.message
            });
            assertion.failure && steps.push({
              action: 'sendLog',
              level: "DEBUG",
              time: testStartTime,
              message: assertion.failure
            });
            assertion.stackTrace &&
            steps.push({
              action: 'sendLog',
              level: "TRACE",
              time: testStartTime,
              message: assertion.stackTrace
            });
          });

          steps.push({
            action: 'finishTestItem',
            end_time: testStartTime,
            status
          });
        }

        steps.push({
          action: 'finishTestItem',
          end_time: suiteEndTime,
        });
      }

      let description = `passed: ${results.passed}; \
failed: ${results.failed}; \
skipped: ${results.skipped}; \
errors: ${results.errors}; \
assertions: ${results.assertions}`;
      let start_time = _.first(steps).start_time;
      end_time = _.last(steps).end_time;

      // Execute steps
      tempId = rpClient.startLaunch({
        start_time,
        description
      }).tempId;

      let stepsTempIds = [tempId];

      steps.forEach((step) => {
        switch (step.action) {
          case 'startTestItem':
            let stepObj = rpClient.startTestItem(step, ...stepsTempIds);
            stepsTempIds.push(stepObj.tempId);
            break;
          case 'finishTestItem':
            rpClient.finishTestItem(stepsTempIds.pop(), step);
            break;
          case 'sendLog':
            rpClient.sendLog(_.last(stepsTempIds), step);
        }
      });
      finalize();
    })
    .catch(finalize);
};