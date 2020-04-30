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
* Real-time reporting
* Post-factum reporting

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

1. Create the `nightwatch.conf.js` configuration file.

2. Create the `reporter` instance like:
    ```javascript
    const { RealTimeReporter } = require('@reportportal/agent-js-nightwatch');
    const config = require('./rp.json');
    const rpReporter = new RealTimeReporter(config);
    ```

3. Add global `before` and `after` hook handlers to start and finish launch:
    ```javascript
    module.exports = {
       // ...yourConfig,
       globals: {
          before: function (done) {
               const launchParams = {
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
    
4. Now you able to use agent API in your tests to report results in real time (see the API reference).
    
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
