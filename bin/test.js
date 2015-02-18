'use strict';

var _ = require('lodash'),
    commander = require('commander'),
    command,
    Program = require('./../src/program.js'),
    jsonfile = require('jsonfile'),
    version = jsonfile.readFileSync(__dirname + '/../package.json').version;

command = commander
    .version(version)
    // When proxy is configured, then HTTP requests are forwarded to another proxy.
    // When database is configured, then data store used is a MySQL database.
    .command('listen')
    .option('--port <n>', 'Port on which to start the proxy.', _.parseInt)
    .action(function (env) {
        var WebProxy = require('../src/web-proxy'),
            bunyan = require('bunyan'),
            logger = bunyan.createLogger({name: 'web-proxy'}),
            config = {},
            dataStore = {},
            server;

        config.logger = logger;

        /**
         * @param {Object} reference
         * @param {String} reference.method
         * @param {String} reference.url
         * @return {Null} Returning null will allow HTTP request to progress.
         * @return {Object} response
         * @return {Object} response.headers
         * @return {String} response.body
         */
        config.read = function (request) {
            var key;

            if (request.method !== 'get') {
                logger.trace('Not logging non GET request.');

                return;
            }

            key = JSON.stringify([request.method, request.url]);

            if (dataStore[key]) {
                return dataStore[key];
            }

            return;
        };

        /**
         * @param {Object} reference
         * @param {String} reference.method
         * @param {String} reference.url
         * @param {Object} response
         * @param {Object} response.headers
         * @param {String} response.body
         */
        config.write = function (request, response) {
            var key = JSON.stringify([request.method, request.url]);

            dataStore[key] = response;
        };

        server = WebProxy(config);

        server.listen(9000);
    });

Program.requireOption(command, 'port');

Program.commandProxy(command);
Program.commandDatabase(command);

commander.parse(process.argv);
