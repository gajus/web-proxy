'use strict';

var WebProxy;

/**
 * @param {Object} config
 * @param {Function} config.read
 * @param {Function} config.write
 * @param {Object} config.logger
 */
WebProxy = function (config) {
    var WebProxy = {},
        webproxy = {},
        Promise = require('bluebird'),
        http = require('http'),
        rp = require('request-promise'),
        translator = require('./translator'),
        server,
        logger;

    if (!config) {
        throw new Error('Must configure "read" and "write" handlers.');
    }

    if (!config.read) {
        throw new Error('Must configure "read" handler.');
    }

    if (!config.write) {
        throw new Error('Must configure "write" handler.');
    }

    logger = config.logger;

    if (!logger) {
        logger = require('noop-logger');
    }

    rp = rp.defaults({
        simple: false,
        resolveWithFullResponse: true
    });

    server = http.createServer(function (req, res) {
        translator
            .HTTPRequestToRequest(req)
            .then(function (request) {
                return Promise
                    .resolve(config.read(request))
                    .then(function (response) {
                        if (response) {
                            logger.info({
                                request: translator.requestToLogId(request)
                            }, 'Read response from the data store.');
                            return response;
                        } else {
                            return WebProxy.request(request);
                        }
                    })
                    .then(function (response) {
                        var _ = require('lodash');

                        res.statusCode = response.statusCode;

                        _.forEach(response.headers, function (value, name) {
                            res.setHeader(name, value);
                        });

                        res.end(response.body);
                    });
            });
    });

    /**
     * Perform HTTP request and write eligible response to the data store.
     *
     * @param {Object} requestOptions
     */
    WebProxy.request = function (request) {
        return rp(translator.requestToRequestOptions(request))
            .then(function (incomingMessage) {
                var write = true,
                    response = translator.incomingMessageToResponse(incomingMessage);

                if (incomingMessage.statusCode !== 200) {
                    logger.warn('Not writing request. Status code is not 200.', {
                        request: translator.requestToLogId(request),
                        statusCode: response.statusCode
                    });

                    write = false;
                }

                if (request.url !== incomingMessage.request.href) {
                    logger.warn('Not writing request. Original request URL is different from response URL.', {
                        request: translator.requestToLogId(request),
                        responseURL: incomingMessage.request.href
                    });

                    write = false;
                }

                if (write) {
                    logger.info('Writing response to the data store.', {
                        request: translator.requestToLogId(request)
                    });

                    return Promise
                        .resolve(config.write(request, response))
                        .return(response);
                }

                return response;
            });
    };

    /**
     *
     */
    webproxy.listen = function () {
        return server.listen.apply(server, arguments);
    };

    return webproxy;
};

module.exports = WebProxy;
