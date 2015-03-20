'use strict';

var _ = require('lodash'),
    commander = require('commander'),
    command,
    Program = require('./../src/program.js'),
    jsonfile = require('jsonfile'),
    version = jsonfile.readFileSync(__dirname + '/../package.json').version;

commander.version(version);

command = commander
    .command('cache')
    .description('Start HTTP cache proxy.')
    .option('--port <n>', 'Port on which to start the proxy.', _.parseInt)
    .action(function (env) {
        var program = Program(env),
            WebProxy = require('../src/webproxy'),
            DataStore = require('../src/datastore'),
            Promise = require('bluebird'),
            dataStore,
            bunyan = require('bunyan'),
            logger = bunyan.createLogger({name: 'web-proxy'}),
            config = {},
            server;

        DataStore = DataStore();

        config.logger = logger;
        config.upstream = env.upstream;

        if (env.dbHost) {
            logger.info('Using a MySQL database.', {
                dbHost: env.dbHost,
                dbDatabase: env.dbDatabase
            });

            dataStore = program.database().then(function(db) {
                return DataStore.database(db);
            });
        } else {
            dataStore = DataStore.session();
        }

        config.read = function (request) {
            // @todo Make this into a property.
            /*if (request.method !== 'get') {
                logger.trace('Not logging non GET request.');

                return;
            }*/

            return dataStoreObj.read(request);
        };

        config.write = function (request, response) {
            return dataStoreObj.write(request, response);
        };

        Promise.join(dataStore, function(dataStoreObj) {
            server = WebProxy(config);

            server.listen(env.port);

            logger.info('Listening on port ' + env.port + '.');
        });
    });


Program.requireOption(command, 'port');

Program.commandUpstream(command);
Program.commandDatabase(command);

command = commander
    .command('queue')
    .description('Start HTTP queue proxy.')
    .option('--port <n>', 'Port on which to start the proxy.', _.parseInt)
    .option('--delay <ms>', 'The amount of milliseconds to delay the next request in the queue.', _.parseInt)
    .action(function (env) {
        var program = Program(env),
            WebProxy = require('../src/webproxy'),
            DataStore = require('../src/datastore'),
            dataStore,
            bunyan = require('bunyan'),
            logger = bunyan.createLogger({name: 'web-proxy', level: 'trace'}),
            config = {},
            server;

        DataStore = DataStore();

        config.logger = logger;
        config.upstream = env.upstream;
        config.queue = {};
        if (env.delay) {
            config.queue.delay = env.delay;
        }

        server = WebProxy(config);

        server.listen(env.port);

        logger.info('Listening on port ' + env.port + '.');
    });


Program.requireOption(command, 'port');

Program.commandUpstream(command);
Program.commandDatabase(command);

commander.parse(process.argv);
