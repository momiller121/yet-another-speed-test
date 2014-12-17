var crypto = require('crypto');

var bufs = [];
var generateBufferData = function(times){
    for (var i = 0; i < times; i++) {
        bufs.push(new Buffer(crypto.pseudoRandomBytes(1024)));
    }
}

var randomBufferIndex = function(){
    var max = bufs.length-1;
    var min = 0;
    return Math.floor(Math.random()*(max-min+1)+min);
}

var grabRandomBuffer = function(){
    return bufs[randomBufferIndex()];
}


var RandomBuffers = {
        generate: generateBufferData,
        grab: grabRandomBuffer
    };

module.exports = RandomBuffers;
