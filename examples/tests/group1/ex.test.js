const expect = require('chai').expect;

module.exports = {
  'example test': function (suite){
    suite.assert.ok(true);
    suite.assert.ok(false);
    suite.assert.ok(true);
  }
};