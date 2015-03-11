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
translator.HTTPRequestToRequestDefinition = function (req) {
    var requestDefinition = {},
        Promise = require('bluebird');

    requestDefinition.url = req.url;
    requestDefinition.method = req.method.toLowerCase();
    requestDefinition.headers = req.headers;
    requestDefinition.payload = new Promise(function (resolve) {
        var requestBody = null;

        req.on('data', function (data) {
            requestBody += data;
        });

        req.on('end', function () {
             resolve(requestBody);
        });
    });

    return Promise.props(requestDefinition);
};

/**
 * Maps request definition to options compatible with the 'request' package.
 */
translator.requestDefinitionToRequestOptions = function (requestDefinition) {
    return {
        uri: requestDefinition.url,
        method: requestDefinition.method,
        headers: requestDefinition.headers,
        body: requestDefinition.payload
    };
};

/**
 * @return {Object} options
 * @return {String} options.url
 * @return {String} options.method
 */
translator.requestDefinitionToLogId = function (requestDefinition) {
    var logId = {};

    logId.url = requestDefinition.url;
    logId.method = requestDefinition.method;

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
