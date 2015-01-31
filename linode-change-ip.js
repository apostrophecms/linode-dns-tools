var argv = require('yargs').argv;
var _ = require('lodash');
var async = require('async');

try {
  var client = require('./lib/linode.js')();
} catch (e) {
  usage(e);
}

if (!argv['old']) {
  usage('The old-ip option is required.');
}

if (!argv['new']) {
  usage('The new-ip option is required.');
}

var domains;

return async.series({
  listDomains: function(callback) {
    return api('domain.list', {}, function(err, res) {
      if (err) {
        return callback(err);
      }
      domains = res;
      return callback(null);
    });
  },
  update: function(callback) {
    return async.eachSeries(domains, function(domain, callback) {
      if (argv.domain) {
        if (argv.domain !== domain.DOMAIN) {
          return setImmediate(callback);
        }
      }
      return api('domain.resource.list', { DomainID: domain.DOMAINID }, function(err, records) {
        if (err) {
          return callback(err);
        }
        var interesting = _.filter(records, function(record) {
          return record.TARGET === argv['old'];
        });
        return async.eachSeries(interesting, function(record, callback) {
          record.TARGET = argv['new'];
          if (argv.verbose) {
            console.log('updating ' + record.TYPE + ' record in domain ' + domain.DOMAIN);
          }
          return api('domain.resource.update', record, callback);
        }, callback);
      });
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

function usage() {
  console.error('Usage: linode-change-ip --old=old-ip --new=new-ip [--domain=domain-name]\n');
  console.error('This command will change the old IP to the new one in every');
  console.error('record where it appears.');
  console.error('\n');
  console.error('If you do not specify a domain name, the change is made');
  console.error('for ALL of your domains.');
  process.exit(1);
}
