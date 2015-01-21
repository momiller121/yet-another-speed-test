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