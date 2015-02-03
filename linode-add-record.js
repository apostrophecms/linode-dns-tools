var argv = require('yargs').argv;
var _ = require('lodash');
var async = require('async');

try {
  var client = require('./lib/linode.js')();
} catch (e) {
  usage(e);
}

if (!argv['domain']) {
  usage('The domain option is required.');
}

if (!argv['type']) {
  usage('The type option is required.');
}

if (!argv['name']) {
  usage('The name option is required.');
}

if (!argv['target']) {
  usage('The target option is required.');
}

var domain;

return async.series({
  listDomains: function(callback) {
    return api('domain.list', {}, function(err, res) {
      if (err) {
        return callback(err);
      }
      domain = _.find(res, function(record) {
        return record.DOMAIN === argv.domain;
      });
      if (!domain) {
        return callback('No such domain was found.');
      }
      return callback(null);
    });
  },
  update: function(callback) {
    return api('domain.resource.create', {
      DomainID: domain.DOMAINID,
      Type: argv.type.toUpperCase(),
      Name: argv.name.trim(),
      Target: argv.target.trim()
    }, callback);
  }
}, function(err) {
  if (err) {
    console.error(err);
    process.exit(2);
  }
  process.exit(0);
});

function api(verb, args, callback) {
  if (argv.verbose) {
    console.log(verb);
    console.log(args);
  }
  return client.call(verb, args, callback);
}

function usage(msg) {
  if (msg) {
    console.error(msg);
    console.error('');
  }
  console.error('Usage: linode-add-record --domain=mycompany.com --type=a --name=foo --target=a.b.c.d [--verbose]\n');
  console.error('This command will add a new DNS record. It currently');
  console.error('supports only simple records with a name and target.\n');
  process.exit(1);
}
