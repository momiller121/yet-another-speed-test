function UploadResponseSampler() {
    return {
        run: function (sampleIteration, callback) {
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
                    id: this.dat(sampleIteration)
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
            return Math.round(((sorted[0].rate + sorted[1].rate) / 2)) + " kB/s";
        },
        steps: function () {
            var ONE_MB = 1024 * 1024;
            return [128 * 1024, 256 * 1024, 512 * 1024, ONE_MB, 2 * ONE_MB, 4 * ONE_MB, 8 * ONE_MB, 16 * ONE_MB];
        },
        dat: function (iteration) {
            var text = [];
            var steps = this.steps();
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            if (iteration >= steps.length) {
                iteration = steps.length - 1; // bad idea TODO revisit
            }
            for (var i = 0; i < steps[iteration]; i++)
                text.push(possible.charAt(Math.floor(Math.random() * possible.length)));
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
            $("#results pre").append(">> " + lastUploadSize + " bytes in " + responseTime + "ms  [" + s.prettyThroughput(lastUploadSize, responseTime) + "]\r\n");
            if (upresults.length < sampleLimit && iteration + 1 < s.maxSamples && responseTime < s.responseValidityThreshold) {
                sample(++iteration); //recursive call to collect samples
            } else {
                var responseSummary = s.getResponseSummary(upresults);
                $("#results pre").append("\r\n\r\n>> Average upload throughput: " + responseSummary + "  (average of 2 longest running uploads).");
                callback();
            }
        });
    };
    sample(0); // initiate sampling
};
