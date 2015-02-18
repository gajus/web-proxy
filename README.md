# Web Proxy

[![Travis build status](http://img.shields.io/travis/gajus/web-proxy/master.svg?style=flat)](https://travis-ci.org/gajus/web-proxy)
[![NPM version](http://img.shields.io/npm/v/web-proxy.svg?style=flat)](https://www.npmjs.org/package/web-proxy)

Web Proxy for intercepting and selectively caching HTTP requests.

## Command Line Usage

```sh
node ./bin/proxy --help
```

### MySQL

Web Proxy can be used with a persistant data store. The only backend supported at the moment is MySQL.

To enable use of the MySQL backend, provide connections credentials at the time of starting the proxy.

Database schema can be obtained from `./database/proxy.sql`. Note that table is using `ROW_FORMAT=COMPRESSED`. In order to benefit from the compression, ensure that the following MySQL variables are set:

```
innodb_file_format=BARRACUDA
innodb_file_per_table=ON
```

For more information, refer to http://stackoverflow.com/a/13636565/368691.

### Proxy

Web Proxy can forward all outgoing HTTP requests to another proxy.

To enable forwarding, provide proxy credentials at the time of starting the proxy.