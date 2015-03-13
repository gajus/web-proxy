'use strict';

var WebProxy;

/**
 * @param {Object} config
 * @param {Function} config.read
 * @param {Function} config.write
 * @param {Object} config.logger
 * @param {String} config.proxy
 */
WebProxy = function (config) {
    let WebProxy = {},
        webproxy = {},
        Promise = require('bluebird'),
        http = require('http'),
        _ = require('lodash'),
        request = require('request'),
        translator = require('./translator'),
        URL = require('url'),
        lastRequest = Promise.resolve(),
        requestQueueSize = 0,
        server,
        logger;

    if (!config) {
        throw new Error('Must configure "read" and "write" handlers.');
    }

    if ((config.read || config.write) && (!config.read || !config.write)) {
        throw new Error('Must provide config.read and config.write when starting HTTP cache proxy.');
    }

    if (config.read && config.queue) {
        throw new Error('Proxy cannot act as a queue and cache proxy at the same time. Use upstream forwarding to combine the two.');
    }

    if (!config.read && !config.queue) {
        throw new Error('Proxy must be set to cache or queue mode.')
    }

    logger = config.logger;

    if (!logger) {
        logger = require('noop-logger');
    }

    server = http.createServer(function (httpRequest, httpResponse) {
        translator
            .HTTPRequestToRequestDefinition(httpRequest)
            .then(function (requestDefinition) {

                if (config.read) {
                    return WebProxy.cache(requestDefinition);
                }

                if (config.queue) {
                    return WebProxy.queue(requestDefinition);
                }
            })
            .then(function (response) {
                httpResponse.statusCode = response.statusCode;

                _.forEach(response.headers, function (value, name) {
                    httpResponse.setHeader(name, value);
                });

                httpResponse.end(response.body);
            });
    });

    WebProxy.cache = function (requestDefinition) {
        return Promise
            .resolve(config.read(requestDefinition))
            .then(function (response) {
                if (response) {
                    logger.info({
                        request: translator.requestDefinitionToLogId(requestDefinition)
                    }, 'Read response from the data store.');
                    return response;
                } else {
                    return WebProxy
                        .request(requestDefinition)
                        .then(function (incomingMessage) {
                            let write = true,
                                response = translator.incomingMessageToResponse(incomingMessage);

                            if (incomingMessage.statusCode !== 200) {
                                logger.warn('Not writing request. Status code is not 200.', {
                                    request: translator.requestDefinitionToLogId(requestDefinition),
                                    statusCode: response.statusCode
                                });

                                write = false;
                            }

                            if (requestDefinition.url !== incomingMessage.request.href) {
                                logger.warn('Not writing request. Original request URL is different from response URL.', {
                                    request: translator.requestDefinitionToLogId(requestDefinition),
                                    responseURL: incomingMessage.request.href
                                });

                                write = false;
                            }

                            if (write) {
                                logger.info('Writing response to the data store.', {
                                    request: translator.requestDefinitionToLogId(requestDefinition)
                                });

                                return Promise
                                    .resolve(config.write(requestDefinition, response))
                                    .return(response);
                            }

                            return response;
                        });
                }
            });
    };

    /**
     * Primitive version that just stacks requests in a queue.
     */
    WebProxy.queue = function (requestDefinition) {
        lastRequest = lastRequest.then(function () {
            return WebProxy.request(requestDefinition);
        });

        if (config.queue.delay) {
            lastRequest = lastRequest.delay(config.queue.delay);
        }

        lastRequest.tap(function () {
            requestQueueSize--;

            logger.trace({
                requestQueueSize: requestQueueSize
            }, 'Request queue progress.');
        });

        requestQueueSize++;

        logger.trace({
            requestQueueSize: requestQueueSize,
            request: translator.requestDefinitionToLogId(requestDefinition)
        }, 'New request in the request queue.');

        return lastRequest;
    };

    /**
     * Perform HTTP request and write eligible response to the data store.
     *
     * @param {Object} requestOptions
     */
    WebProxy.request = function (requestDefinition) {
        return new Promise(function (resolve) {
            let requestOptions;

            requestOptions = translator.requestDefinitionToRequestOptions(requestDefinition);

            if (config.upstream) {
                requestOptions.proxy = config.upstream;
            }

            request(requestOptions, function (error, incomingMessage) {
                resolve(incomingMessage);
            });
        })
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
