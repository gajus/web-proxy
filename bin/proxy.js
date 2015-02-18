'use strict';

var _ = require('lodash'),
    commander = require('commander'),
    command,
    Program = require('./../src/program.js'),
    jsonfile = require('jsonfile'),
    version = jsonfile.readFileSync(__dirname + '/../package.json').version;

command = commander
    .version(version)
    .command('listen')
    .option('--port <n>', 'Port on which to start the proxy.', _.parseInt)
    .action(function (env) {
        var program = Program(env),
            WebProxy = require('../src/web-proxy'),
            bunyan = require('bunyan'),
            logger = bunyan.createLogger({name: 'web-proxy'}),
            config = {},
            dataStore = {},
            server,
            db;

        config.logger = logger;

        if (env.dbHost) {
            logger.info('Using a MySQL database.', {
                dbHost: env.dbHost,
                dbDatabase: env.dbDatabase
            });

            db = program.database();
        }

        /**
         * @param {Object} reference
         * @param {String} reference.method
         * @param {String} reference.url
         * @return {Null} Returning null will allow HTTP request to progress.
         * @return {Object} response
         * @return {Number} response.statusCode
         * @return {Object} response.headers
         * @return {String} response.body
         */
        config.read = function (request) {
            var key;

            if (request.method !== 'get') {
                logger.trace('Not logging non GET request.');

                return;
            }

            if (db) {
                return db
                    .query('SELECT `status_code`, `headers`, `body` FROM `request` WHERE `method` = ? AND `url` = ? ORDER BY `created_at` DESC LIMIT 1', [
                        request.method,
                        request.url
                    ])
                    .then(function (rows) {
                        if (!rows.length) {
                            return;
                        }

                        return {
                            statusCode: rows[0].status_code,
                            headers: JSON.parse(rows[0].headers),
                            body: rows[0].body
                        };
                    });
            } else {
                key = JSON.stringify([request.method, request.url]);

                if (dataStore[key]) {
                    return dataStore[key];
                }
            }

            return;
        };

        /**
         * @param {Object} reference
         * @param {String} reference.method
         * @param {String} reference.url
         * @param {Object} response
         * @param {Number} response.statusCode
         * @param {Object} response.headers
         * @param {String} response.body
         */
        config.write = function (request, response) {
            var key;

            if (db) {
                return db
                    .query('INSERT INTO `request` SET `method` = ?, `url` = ?, `status_code` = ?, `headers` = ?, `body` = ?', [
                        request.method,
                        request.url,
                        response.statusCode,
                        JSON.stringify(response.headers),
                        response.body
                    ]);
            } else {
                key = JSON.stringify([request.method, request.url]);

                dataStore[key] = response;
            }
        };

        server = WebProxy(config);

        server.listen(env.port);

        logger.info('Listening on port ' + env.port + '.');
    });

Program.requireOption(command, 'port');

Program.commandProxy(command);
Program.commandDatabase(command);

commander.parse(process.argv);
