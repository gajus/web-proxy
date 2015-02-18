'use strict';

var commander = require('commander'),
    jsonfile = require('jsonfile'),
    version = jsonfile.readFileSync('./../package.json').version;

commander
    .version(version);
