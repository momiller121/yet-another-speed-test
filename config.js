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
            _16MB: {size: 16 * 1024 * 1024, uri: "/download/16MB"}
        }
    },
    upload: {
        //Threshold where we drop a connection that's pushing too much data
        maxPayload:1024 * 1024 * 16
    }

};


module.exports = config;