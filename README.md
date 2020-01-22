# agent-js-nightwatch

Agent for integration Nightwatch with ReportPortal.
[ReportPortal](http://reportportal.io/)<br>
[ReportPortal on GitHub](https://github.com/reportportal)

### How to use
1. Install the agent in your project:
```cmd

```
2. Create reporter.js file with code like:
```javascript
const rpReporter = require('agent-js-nightwatch');
const config = require('./rp');

module.exports = {
  write : (results, options, done) => rpReporter(results, config, done)
};
```
where rp.json - file with reportportal configuration

3. Add a reporter to executed command:
```cmd
nightwatch --config examples/nightwatch.json --reporter examples/reporter.js
```
### Example

To run example:
```cmd
npm test
```
