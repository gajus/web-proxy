'use strict';

var translator = {};

/**
 * Convert HTTP request stream to a promise that when resolved
 * defines the original request.
 *
 * @param {Object} req
 * @return {Object} options
 * @return {String} options.url
 * @return {String} options.method
 * @return {String} options.headers
 * @return {String|Null} options.payload
 */
translator.HTTPRequestToRequest = function (req) {
    var request = {},
        Promise = require('bluebird');

    request.url = req.url;
    request.method = req.method.toLowerCase();
    request.headers = req.headers;
    request.payload = new Promise(function (resolve) {
        var requestBody = null;

        req.on('data', function (data) {
            requestBody += data;
        });

        req.on('end', function () {
             resolve(requestBody);
        });
    });

    return Promise.props(request);
};

/**
 * Maps request definition to options compatible with the 'request' package.
 */
translator.requestToRequestOptions = function (request) {
    return {
        uri: request.url,
        method: request.method,
        headers: request.headers,
        body: request.payload
    };
};

/**
 * @return {Object} options
 * @return {String} options.url
 * @return {String} options.method
 */
translator.requestToLogId = function (request) {
    var logId = {};

    logId.url = request.url;
    logId.method = request.method;

    return logId;
};

translator.incomingMessageToResponse = function (incomingMessage) {
    var response = {};

    response.statusCode = incomingMessage.statusCode;
    response.headers = incomingMessage.headers;
    response.body = incomingMessage.body;

    return response;
};

module.exports = translator;
