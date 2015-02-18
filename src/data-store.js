'use strict';

var DataStore = {};

DataStore.database = function (db) {
    var ds = {};

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
    ds.read = function (request) {
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
    ds.write = function (request, response) {
        return db
            .query('INSERT INTO `request` SET `method` = ?, `url` = ?, `status_code` = ?, `headers` = ?, `body` = ?', [
                request.method,
                request.url,
                response.statusCode,
                JSON.stringify(response.headers),
                response.body
            ]);
    };

    return ds;
};

DataStore.session = function () {
    var ds = {},
        data = {},
        makeKey;

    ds.read = function (request) {
        var key = makeKey(request);

        if (data[key]) {
            return data[key];
        }
    };

    ds.write = function (request, response) {
        var key = makeKey(request);

        data[key] = response;
    };

    makeKey = function (request) {
        return JSON.stringify([request.method, request.url]);
    };

    return ds;
};

module.exports = DataStore;
