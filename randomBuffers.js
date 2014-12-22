// custom module to prep some random data buffers
// server will hold this in memory and we are much easier on the cpu at runtime
var crypto = require('crypto');

var bufs = [];
var generateBufferData = function(times){
    for (var i = 0; i < times; i++) {
        bufs.push(new Buffer(crypto.pseudoRandomBytes(64*1024)));
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
        size:64, //the global buffer size (64kb seems optimal)
        generate: generateBufferData,
        grab: grabRandomBuffer
    };

module.exports = RandomBuffers;
