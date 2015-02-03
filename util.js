var fs = require('fs');
var rangeCheck = require('range_check');

exports.isInt = function (value) {
    var er = /^-?[0-9]+$/;
    return er.test(value);
};

//http://stackoverflow.com/questions/21194934/node-how-to-create-a-directory-if-doesnt-exist
exports.ensureExists = function(path, mask, cb) {
    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
    }
    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
            else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
    });
}

exports.ipInRange = function(config,ip){
    var config = config;
    if(!config){
        config = {};
        config.authorizedRanges = []; //empty range means any client allowed
    }
    var result = false; //something needs to turn this true for access to be provided

    // if config is not defining a cidr mask list
    if(config.authorizedRanges.length==0){
        result = true;
    }

    // iterate throught the mask list looking for a reason to allow
    for(var i=0;i<config.authorizedRanges.length;i++){
        if(rangeCheck.inRange(ip, config.authorizedRanges[i])){
            result = true;
        }
    }
    return result;
}

exports.markConnection = function(request){
    if (!request.connection.usageCount) {  // mark the http connection with the client action
        request.connection.usageCount = 1; // we're staying away from session (cookies) - not all clients are browsers
    } else {                              // this count informs (assuming http keep-alive) client 'session' activity
        request.connection.usageCount++;   // on the http connection
    }
}

exports.convertFormDataToJSON = function(payload){ // expecting application/x-www-form-urlencoded data like fingerprint=3971884212&latency=3.4&download=63051&upload=23012
    var payloadObject = {fingerprint: "",latency: -1,download: -1,upload: -1}; // sets our types
    var parts = payload.split("&");
    for(var i=0;i<parts.length;i++){
        var pair = parts[i].split("=");
        if((payloadObject[pair[0]]=="" || payloadObject[pair[0]]==-1) && !isNaN(pair[1]+1-1)){ // if our template is looking for this name
            payloadObject[pair[0]] = (payloadObject[pair[0]]=="")? pair[1] : Number(pair[1]);
        }
    }
    return payloadObject;
}

