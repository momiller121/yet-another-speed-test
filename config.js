var fs = require('fs');
var bunyan = require('bunyan');
var config = {
    // the following cidr masks represent the authorized client ip ranges
    // It is a string array of 0 to many valid cidr masks
    authorizedRanges:["127.0.0.1/32"], //localhost only by default
    download: {
        //These are the package sizes that are supported for download
        packages: {
            _128KB: {size: 128 * 1024, uri: "/download/128kb"},
            _256KB: {size: 256 * 1024, uri: "/download/256kb"},
            _512KB: {size: 512 * 1024, uri: "/download/512kb"},
            _1MB: {size: 1024 * 1024, uri: "/download/1MB"},
            _2MB: {size: 2 * 1024 * 1024, uri: "/download/2MB"},
            _4MB: {size: 4 * 1024 * 1024, uri: "/download/4MB"},
            _8MB: {size: 8 * 1024 * 1024, uri: "/download/8MB"},
            _16MB: {size: 16 * 1024 * 1024, uri: "/download/16MB"},
            _32MB: {size: 32 * 1024 * 1024, uri: "/download/32MB"},
            _64MB: {size: 64 * 1024 * 1024, uri: "/download/64MB"},
            _128MB: {size: 128 * 1024 * 1024, uri: "/download/128MB"},
            _256MB: {size: 256 * 1024 * 1024, uri: "/download/256MB"}
        },
        maxSamples:12, // should be the same as number of packages
        responseValidityThreshold:8000 //ms (network transit time target)
    },
    upload: {
        //Threshold where we drop a connection that's pushing too much data
        maxPayload: 1024 * 1024 * 17,
        // These are the payload size steps that we want the client to upload
        steps:[128 * 1024, 256 * 1024, 512 * 1024, 1024 * 1024, 2 * 1024 * 1024, 4 * 1024 * 1024, 8 * 1024 * 1024, 16 * 1024 * 1024],
        maxSamples:8, // should be the same as steps.length
        responseValidityThreshold:8000 //ms (network transit time target)
    },
    accesslog: bunyan.createLogger({
        name: 'access',
        streams: [{
            type: 'rotating-file',
            path: './logs/access.log',
            period: '1d',   // daily rotation
            count: 7        // keep 7 days back copies
        }],
        serializers: {
            req: function req(req) {
                if (!req || !req.connection)
                    return req;
                return {
                    method: req.method,
                    url: req.url,
                    headers: req.headers,
                    remoteAddress: req.connection.remoteAddress,
                    remotePort: req.connection.remotePort,
                    requestId: req.req_id,                 // we set this in Express middleware
                    connectionId: req.connection.customId  // we set this in Express middleware
                };
            },
            res: function res(res) {
                if (!res || !res.statusCode)
                    return res;
                return {
                    statusCode: res.statusCode,
                    header: res._header
                }
            }
        }
    }),
    serverlog: bunyan.createLogger({
        name: 'server',
        streams: [{
            type: 'rotating-file',
            path: './logs/server.log',
            period: '1d',   // daily rotation
            count: 3        // keep 3 back copies
        }]
    }),
    resultslog: bunyan.createLogger({
        name: 'results',
        streams: [{
            type: 'rotating-file',
            path: './logs/results.log',
            period: '1d',   // daily rotation
            count: 3        // keep 3 back copies
        }]
    })
};


module.exports = config;
