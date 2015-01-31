var osenv = require('osenv');
var api = require('linode-api');
var fs = require('fs');

module.exports = function() {
  var apiKey;
    try {
    apiKey = fs.readFileSync('.linode-key', 'utf8').trim();
  } catch (e) {
    try {
      var home = osenv.home();
      apiKey = fs.readFileSync(home + '/.linode-key', 'utf8').trim();
    } catch (e) {
      throw 'There must be a .linode-key file in the current directory, or in\n' + 'your home directory.';
    }
  }
  return new (api.LinodeClient)(apiKey);
};

