# linode-dns-tools

<a href="http://apostrophenow.org/"><img src="https://raw.github.com/punkave/linode-dns-tools/master/logos/logo-box-madefor.png" align="right" /></a>

A collection of tools for the [linode DNS API](https://www.linode.com/api/dns).

## Requirements

You must provide your linode API key, which you can generate via your linode profile. If there is a `.linode-key` file in the current directory, it is used, otherwise the `.linode-key` file in your home directory is used.

## Installation

```
npm install linode-dns-tools
```

# The tools

## linode-import-zone-file

Imports bind-style DNS zone files via the Linode API. Very useful if you've exported one from another hosting service that won't allow Linode's automatic zone export feature.

### Usage

```
linode-import-zone-file zonefile
```

It takes a little time depending on how many records you have.

TODO: currently no support for SRV records. Pull requests welcome.

Note that if an error is reported, no records beyond that point are imported.

Runs quietly if nothing is wrong. Use `--verbose` for detailed output.

## linode-change-ip

Globally replace an IP address in all of your domains, or one particular domain. Very useful when you replace a server.

### Usage

```
linode-change-ip --old=1.1.1.1 --new=2.2.2.2
```

Optionally you can do this for just one domain:

```
linode-change-ip --old=1.1.1.1 --new=2.2.2.2 --domain=mycompany.com
```

Runs quietly if nothing is wrong. Use `--verbose` for detailed output.

## About P'unk Avenue and Apostrophe

`linode-dns-tools` was created at [P'unk Avenue](http://punkave.com) to support our work on Apostrophe, an open-source content management system built on node.js. If you like `linode-dns-tools` you should definitely [check out apostrophenow.org](http://apostrophenow.org). Also be sure to visit us on [github](http://github.com/punkave).

## Support

Feel free to open issues on [github](http://github.com/punkave/linode-dns-tools).

<a href="http://punkave.com/"><img src="https://raw.github.com/punkave/linode-dns-tools/master/logos/logo-box-builtby.png" /></a>
