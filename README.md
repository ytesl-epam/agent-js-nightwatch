# agent-js-nightwatch

Agent for integration NightwatchJS with ReportPortal.
* More about [NightwatchJS](https://nightwatchjs.org/)
* More about [ReportPortal](http://reportportal.io/)

##Installation

Install the agent in your project:
```cmd
npm install --save-dev @reportportal/agent-js-nightwatch
```
##Configuration

Create rp.json file with reportportal configuration:
```json
{
    "token": "00000000-0000-0000-0000-000000000000",
    "endpoint": "https://your.reportportal.server/api/v1",
    "project": "YourReportPortalProjectName",
    "launch": "YourLauncherName",
    "attributes": [
        {
            "key": "YourKey",
            "value": "YourValue"
        },
        {
            "value": "YourValue"
        }
    ],
    "description": "Your launch description",
    "rerun": true,
    "rerunOf": "launchUuid of already existed launch",
    "parallelRun": true
}
```

| Parameter             | Description                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| token                 | User's Report Portal token from which you want to send requests. It can be found on the profile page of this user.|
| endpoint              | URL of your server. For example 'https://server:8080/api/v1'.                                                     |
| launch                | Name of launch at creation.                                                                                       |
| project               | The name of the project in which the launches will be created.                                                    |
| rerun                 | *Default: false.* Enable [rerun](https://github.com/reportportal/documentation/blob/master/src/md/src/DevGuides/rerun.md)|
| rerunOf               | UUID of launch you want to rerun. If not specified, report portal will update the latest launch with the same name|
| parallelRun           | *Default: false.* Indicates if tests running in parallel (uses for post-factum-reporter)|

##Reporting

**This agent supports two types of reporting:**
* Post-factum reporting
* Real-time reporting

###Post-factum  reporting

This reporter sends results of test executions to Report Portal when **all tests have been finished**.

1. Create reporter.js file with code like:
    ```javascript
    const { PostFactumReporter } = require('@reportportal/agent-js-nightwatch');
    const config = require('./rp.json');
    const reporter = new PostFactumReporter(config);
    
    module.exports = {
        write : (results, options, done) => {
          return reporter.startReporting(results, done);
        }
    };
    ```

2. Create the `nightwatch.conf.js` configuration file.

3. Run your tests with --config and --reporter options specified:
    ```cmd
    nightwatch --config ./nightwatch.conf.js --reporter ./reporter.js
    ```

####Example

To run example:
```cmd
cd @reportportal/agent-js-nightwatch && npm run example:postFactumReporter
```

###Real-time reporting

This reporter sends results of test executions to Report Portal **during tests run**.

Since Nightwatch does not initially support real-time test report results, this approach requires a bit more preparation.

Since tests in nightwatch can be run sequentially or in parallel, each of the execution methods requires its own small preparation steps.

Each run type supports the Reporting API to use it directly in tests.

####Default run

1. Create the `nightwatch.conf.js` configuration file.

2. Create the `reporter` instance like:
    ```javascript
    const { RealTimeReporter, ReportingAPI } = require('@reportportal/agent-js-nightwatch');
    const config = require('./rp.json');
    const rpReporter = new RealTimeReporter(config);
    ```

3. Add global `before` and `after` hook handlers:<br/>
Start and finish launch here.<br/>
Also to use Reporting API it must be initialized in `before` hook and destroyed in `after` hook.
    ```javascript
    module.exports = {
       // ...yourConfig,
       globals: {
          before: function (done) {
             ReportingAPI.init();

             const launchParams = { // launch params from rp.json can be overwritten here
                 description: 'Awesome launch',
                 attributes: [{ key: 'status', value: 'passed' }],
             };
             
             rpReporter.startLaunch(launchParams);
             done();
          },
                    
          after: function (done) {
             rpReporter.finishLaunch();
          
             ReportingAPI.destroy();
             done();
          },  
       }
       
    }
    
    ```
4. Now you able to use agent API in tests to report results in real time (see the API reference).<br/>
No other preparations are required from the test definitions.

####Parallel run

1. Create the `nightwatch.conf.js` configuration file.

2. Add global `before` and `after` hook handlers:<br/>
Start and finish launch here.<br/>
Also you create `rpReporter` instance inside the `before` hook body, because the reporter must be created **ONLY ONCE** for the main process.
    ```javascript
    const { RealTimeReporter } = require('@reportportal/agent-js-nightwatch');
    const config = require('./rp.json');
    let rpReporter;
 
    module.exports = {
       // ...yourConfig,
       globals: {
          before: function (done) {
             rpReporter = new RealTimeReporter(config);

             const launchParams = { // launch params from rp.json can be overwritten here
                 description: 'Awesome launch',
                 attributes: [{ key: 'status', value: 'passed' }],
             };
             
             rpReporter.startLaunch(launchParams);
             done();
          },
                    
          after: function (done) {
             rpReporter.finishLaunch();
             done();
          },  
       }
       
    }
    
    ```

3. To start using the Reporting API in tests, you must initialize and destroy the API in **EACH** test suite:
    ```javascript
    const { ReportingAPI } = require('@reportportal/agent-js-nightwatch');
    ReportingAPI.init();
    
    describe('Suite name', function() {
    
      after((browser, done) => {
        browser.end(() => {
          ReportingAPI.destroy();
          done();
        });
      });
    });
    ```
    
4. Now you able to use agent API in tests to report results in real time (see the API reference).
    
####Reporting API

#####Items&hooks reporting

The API provide methods for starting and finishing test items and hooks.

###### startSuite
    ```javascript
    describe('Suite name', function() {
      before((browser, done) => {
        const suiteStartObj = {
          name: 'Suite name',
          attributes: [{ key: 'suite', value: 'any' }],
          description: 'Suite description',
        };
        PublicReportingAPI.startSuite(suiteStartObj);
        done();
      });
    });
    
    ```

####Example

To run example:
```cmd
cd @reportportal/agent-js-nightwatch && npm run example:postFactumReporter
```
