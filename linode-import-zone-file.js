var fs = require('fs');
var argv = require('yargs').argv;
var _ = require('lodash');
var async = require('async');

if (argv._.length !== 1) {
  usage();
}

try {
  var client = require('./lib/linode.js')();
} catch (e) {
  usage(e);
}

var input = fs.readFileSync(argv._[0], 'utf8');

// 1104251419 ; serial
// 10800 ; refresh
// 3600 ; retry
// 604800 ; expire
// 10800 ; minimum

var timing = input.match(/\([\s\S]+?\)/);
if (!timing) {
  usage("I don't see an SOA record");
}
timing = timing[0];
timing = timing.split(/[\r\n]+/);
timing = _.filter(
  _.map(timing, function(item) {
    var matches = item.match(/\d+/);
    if (matches) {
      return matches[0];
    }
  }), function(item) {
    return !!item;
  }
);

if (timing.length !== 5) {
  usage('Unable to parse SOA record, should have 5 numbers');
}

timing = {
  serial: timing[0],
  refresh: timing[1],
  retry: timing[2],
  expire: timing[3],
  minimum: timing[4]
};

var lines = input.split(/[\r\n]+/);

// Match one record, with optional TTL
var regex = new RegExp(/\s*(\S+)\s+((\d+)\s+)?([A-Z]+)\s+(.*?)\s*$/);
var records = _.map(
  _.filter(lines, (function(line) {
    return line.match(regex);
  })),
  function(line) {
    var fields = line.match(regex);
    var result = {
      name: fields[1],
      ttl: fields[3],
      type: fields[4],
      value: fields[5]
    };

    // Quotation marks are not actually part of the
    // value of the TXT record
    result.value = result.value.replace(/"/g, '');
    if (!result.ttl) {
      delete result.ttl;
    }
    if (result.type === 'MX') {
      var matches = result.value.match(/(\d+)\s*(.*)/);
      if (!matches) {
        usage("MX record doesn't look valid");
      }
      result.priority = matches[1];
      result.value = matches[2];
    }
    return result;
  }
);

// Don't defeat the purpose by importing NS records,
// let linode provide those
records = _.filter(records, function(record) {
  return record.type !== 'NS';
});

if (!records.length) {
  usage("No SOA record found in file.");
}

var domainName = records[0].name;

records = records.slice(1);

var id;

return async.series({
  createDomain: function(callback) {
    return api('domain.create', {
      Domain: domainName,
      Type: 'master',
      SOA_Email: 'admin@' + domainName,
      Refresh_sec: timing.refresh,
      Retry_sec: timing.retry,
      Expire_sec: timing.expire,
      TTL_sec: timing.minimum
    }, function(err, res) {
      if (err) {
        return callback(err);
      }
      id = res.DomainID;
      return callback(null);
    });
  },
  createRecords: function(callback) {
    return async.eachSeries(records, function(item, callback) {
      var data = {
        DomainID: id,
        Type: item.type,
        Name: item.name,
        Target: item.value.replace(/\.$/, '')
      };
      if (item.type === 'MX') {
        data.Priority = item.priority;
      }
      if (item.ttl) {
        data.TTL_sec = item.ttl;
      }
      return api('domain.resource.create', data, function(err) {
        if (err) {
          console.error('Error for this record:');
          console.error(data);
          console.error('in the ' + domainName + ' domain');
        }
        return callback(err);
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

function usage(msg) {
  if (msg) {
    console.error(msg);
  }
  console.error('Usage: linode-import-zone-file zonefile\n');
  console.error('The zone file should be in the BIND format used');
  console.error('by most nameservers. Some hosts will let you export');
  console.error('such a file.');
  process.exit(1);
}
