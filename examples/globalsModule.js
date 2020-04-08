const { RealTimeReporter } = require('../build');
const config = require('./rp');

const rpReporter = new RealTimeReporter({ ...config, launch: 'REAL_TIME_REPORTER_LAUNCH' });

module.exports = {
    before: function (done) {
        const launchParams = {
            description: 'This launch contains nightwatch tests results run with chromedriver',
            attributes: [{ key: 'lib', value: 'chromedriver' }, { key: 'agent', value: 'nightwatch' }],
        };

        rpReporter.startLaunch(launchParams);
        done();
    },

    after: function (done) {
        rpReporter.finishLaunch();
        done();
    },
};
