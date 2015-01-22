var downresults = [];
var packageCache = [];
function DownloadResponseSampler() {
    return {
        run: function (sampleIteration, packages, callback) {
            this.steps = packages;
            var start = new Date;
            var customContext = {
                cb: callback,
                startTime: start,
                sampleIteration: sampleIteration
            };
            var request = $.ajax({
                url: this.steps[sampleIteration].uri,
                type: "GET",
                cache: false,
                context: customContext
            });
            request.done(function (msg) {
                var end = new Date;
                var elapsed = end - this.startTime;
                msg = null;
                this.cb(this.sampleIteration, elapsed);
            });
            request.fail(function (jqXHR, textStatus) {
                alert("Request failed: Speed test is not currently available. Please try again later." + textStatus);
            });
        },
        getResponseSummary: function (resultArray) {
            var sorted = resultArray.sort(function (a, b) {
                return b.bytes - a.bytes;
            }); // sort descending by bytes (we want the largest successful payloads)
            return Math.round(((sorted[0].rate + sorted[1].rate) / 2)) + " kB/s";
        },
        prettyThroughput: function (bytes, time) {
            var kb = bytes / 1024;
            var sec = time / 1000;
            return Math.round(kb / sec) + " kB/s"
        },
        maxSamples: 12,
        responseValidityThreshold: 8000 //ms (we want a request that lasts at least this long for our sample)
    }
};


var doDownload = function (callback) {
    downresults = []; //reset results
    var sampleLimit = 12;
    var sample = function (sampleIteration, packageCache) {
        var s = new DownloadResponseSampler();
        // run the sampler's main function
        s.run(sampleIteration, packageCache, function (iteration, responseTime) {
            var lastDownloadSize = s.steps[iteration];
            downresults.push({
                rt: responseTime,
                bytes: s.steps[iteration].size,
                rate: Math.round((s.steps[iteration].size / 1024) / (responseTime / 1000))
            });
            $("#results pre").append(">> " + s.steps[iteration].size + " bytes in " + responseTime + "ms  [" + s.prettyThroughput(s.steps[iteration].size, responseTime) + "]\r\n");
            if (downresults.length < sampleLimit && iteration + 1 < s.maxSamples && responseTime < s.responseValidityThreshold) {
                sample(++iteration, packageCache); //recursive call to collect samples
            } else {
                var responseSummary = s.getResponseSummary(downresults);
                $("#results pre").append("\r\n\r\n>> Average download throughput: " + responseSummary + "  (average of 2 longest running downloads).");
                callback();
            }
        });
    };
    sample(0, packageCache); // initiate sampling
};