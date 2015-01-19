var fs = require('fs');
var bunyan = require('bunyan');
var config = {
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
        }
    },
    upload: {
        //Threshold where we drop a connection that's pushing too much data
        maxPayload: 1024 * 1024 * 17
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
    })
};


module.exports = config;