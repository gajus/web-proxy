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
            DataStore = require('../src/data-store'),
            dataStore,
            bunyan = require('bunyan'),
            logger = bunyan.createLogger({name: 'web-proxy'}),
            config = {},
            server;

        config.logger = logger;

        if (env.dbHost) {
            logger.info('Using a MySQL database.', {
                dbHost: env.dbHost,
                dbDatabase: env.dbDatabase
            });

            dataStore = DataStore.database(program.database());
        } else {
            dataStore = DataStore.session();
        }

        config.read = function (request) {
            if (request.method !== 'get') {
                logger.trace('Not logging non GET request.');

                return;
            }

            return dataStore.read(request);
        };

        config.write = function (request, response) {
            return dataStore.write(request, response);
        };

        server = WebProxy(config);

        server.listen(env.port);

        logger.info('Listening on port ' + env.port + '.');
    });

Program.requireOption(command, 'port');

Program.commandProxy(command);
Program.commandDatabase(command);

commander.parse(process.argv);
