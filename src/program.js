'use strict';

var Program,
    _ = require('lodash');

Program = function (command) {
    var program = {};

    if (command.setup && command.setup.requireOption) {
        _.forEach(command.setup.requireOption, function (optionName) {
            if (!command[optionName]) {
                throw new Error('Must define "' + optionName + '" option.');
            }
        });
    }

    /**
     * Connect to the database using configuration
     * provided via the command-line options (--db-host,
     * --db-database, --db-user, --db-password).
     *
     * @return {promise-mysql}
     */
    program.database = function () {
        var mysql = require('promise-mysql'),
            db,
            config = {};

        if (!command.setup.database) {
            throw new Error('Database has not been setup for this command.');
        }

        if (!command.dbHost) {
            throw new Error('Must define database host.');
        }

        if (!command.dbDatabase) {
            throw new Error('Must define database name.');
        }

        config.host = command.dbHost;
        config.database = command.dbDatabase;

        if (command.dbUser) {
            config.user = command.dbUser;
        }

        if (command.dbPassword) {
            config.password = command.dbPassword;
        }

        db = mysql.createConnection(config);

        return db;
    };

    return program;
};

/**
 * @todo
 */
Program.requireOption = function (command, optionName) {
    command.setup = command.setup || {};
    command.setup.requireOption = command.setup.requireOption || [];

    command.setup.requireOption.push(optionName);
};

/**
 * Enable upstream forwarding support.
 *
 * @param {Object} command
 */
Program.commandUpstream = function (command) {
    command.setup = command.setup || {};

    command.setup.upstream = true;

    command.option('--upstream <http://host[:port]>', 'Forward all requests to upstream proxy server.')
};

/**
 * Enable database support.
 *
 * @param {Object} command
 */
Program.commandDatabase = function (command) {
    command.setup = command.setup || {};

    command.setup.database = true;

    command.option('--db-host [host]', 'Database host.');
    command.option('--db-database [name]', 'Database name.');
    command.option('--db-user [user]', 'User used to access the database.');
    command.option('--db-password [password]', 'Password used to access the database.');
};

module.exports = Program;
