// This produces 256kB of random buffer data in 16 16kB chunks
// The upload process takes advantage of the prework in assembing the upload payload data
var uploadBuffers = [];
var getRandom = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
};

(function primeBuffers() {
    var oneKbBuffers = [];
    var text = [];
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var len = possible.length;
    for (var j = 0; j < 16; j++) {
        text = []; //reset
        for (var i = 0; i < 1024; i++) {
            text.push(possible.charAt(Math.floor(Math.random() * len)));
        }
        oneKbBuffers.push(text.join(''));
    }
    // now assemble the larger buffers
    var tmpBuff = [];
    for (var k = 0; k < 16; k++) {
        //console.log(getRandom(0, 15));
        tmpBuff = []; //reset
        for (var i = 0; i < 16; i++) {
            tmpBuff.push(oneKbBuffers[getRandom(0, 15)]);
        }
        uploadBuffers.push(tmpBuff.join(''));
    }
})();


function UploadResponseSampler() {
    return {
        run: function (sampleIteration, callback) {
            var postData = this.genData(sampleIteration); //build the post data outside of the timer
            var start = new Date;
            var customContext = {
                cb: callback,
                startTime: start,
                sampleIteration: sampleIteration
            };
            var request = $.ajax({
                url: "/upload",
                type: "POST",
                data: {
                    id: postData
                },
                context: customContext
            });
            request.done(function (msg) {
                var end = new Date;
                var elapsed = end - this.startTime;
                this.cb(this.sampleIteration, elapsed);
            });
            request.fail(function (jqXHR, textStatus) {
                //TODO - report the upload too large message here
                alert("Request failed: Speed test is not currently available. Please try again later." + textStatus);
            });
        },
        getResponseSummary: function (resultArray) {
            var sorted = resultArray.sort(function (a, b) {
                return b.bytes - a.bytes;
            }); // sort descending by bytes (we want the largest successful payloads)
            return Math.round(((sorted[0].rate + sorted[1].rate) / 2));
        },
        getFriendlyFormat: function (kbs) {
            if((kbs/1024)>1){
                return +(Math.round((kbs/1024) + "e+2")  + "e-2") + " MB/sec";
            }else{
                return kbs + " kB/second";
            }
        },
        steps: function () {
            var ONE_MB = 1024 * 1024;
            return [128 * 1024, 256 * 1024, 512 * 1024, ONE_MB, 2 * ONE_MB, 4 * ONE_MB, 8 * ONE_MB, 16 * ONE_MB];
        },
        genData: function (iteration) {
            var text = [];
            var steps = this.steps();
            if (iteration >= steps.length) {
                iteration = steps.length - 1; // bad idea TODO revisit (need to build from bigger blocks for speed)
            }
            for (var i = 0; i < (steps[iteration]/1024/16); i++)
                text.push(uploadBuffers[getRandom(0,15)]);
            return text.join('');
        },
        prettyThroughput: function (bytes, time) {
            var kb = bytes / 1024;
            var sec = time / 1000;
            return Math.round(kb / sec) + " kB/s"
        },
        maxSamples: 8,
        responseValidityThreshold: 8000 //ms (we want a request that lasts at least this long for our sample)
    }
}


var upresults = [];
var doUpload = function (callback) {
    $("#results div#up").append("--------------------------------------------------<br/>UPLOAD:<br/>");
    upresults = []; //reset results
    var sampleLimit = 12;
    var sample = function (sampleIteration) {
        var s = new UploadResponseSampler();
        s.run(sampleIteration, function (iteration, responseTime) {
            var lastUploadSize = s.steps()[iteration];
            upresults.push({
                rt: responseTime,
                bytes: lastUploadSize,
                rate: Math.round((lastUploadSize / 1024) / (responseTime / 1000))
            });
            $("#results div#up").append(">> " + lastUploadSize + " bytes in " + responseTime + "ms  [" + s.prettyThroughput(lastUploadSize, responseTime) + "]<br/>");
            if (upresults.length < sampleLimit && iteration + 1 < s.maxSamples && responseTime < s.responseValidityThreshold) {
                sample(++iteration); //recursive call to collect samples
            } else {
                var responseSummary = s.getResponseSummary(upresults);
                $("#results div#up").append(">> Average upload throughput: <span class=dat>" + s.getFriendlyFormat(responseSummary) + "</span>  (average of 2 longest running uploads).<br/>");
                testResults.upload = responseSummary;
                callback();
            }
        });
    };
    sample(0); // initiate sampling
};
