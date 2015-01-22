function LatencySampler() {
    return {
        sampleImage: new Image(),
        sampleImageSrc: "/resources/blank.gif?" + Math.random(),
        run: function (callback) {
            var start = new Date;
            this.sampleImage.onload = function () {
                var latency = new Date - start;
                callback(latency);
            };
            this.sampleImage.src = this.sampleImageSrc;
        },
        calculateMeanLatency: function (resultArray) {
            var sorted = resultArray.sort(function (a, b) {
                return a - b
            }); // sort ascending
            sorted.pop();   //drop the slowest
            sorted.shift(); //drop the fastest
            var sumOf = 0;
            for (var i = 0; i < sorted.length; i++) {
                sumOf += resultArray[i];
            }
            return sumOf / sorted.length;
        }
    }
}

var results = [];
var doLatency = function (callback) {
    results = []; //reset results
    var sampleLimit = 12;
    var sample = function () {
        var s1 = new LatencySampler();
        s1.run(function (latency) {
            results.push(latency);
            $("#results pre").append(">> " + latency + "ms");
            if (results.length < sampleLimit) {
                sample(); //recursive call to collect samples
            } else {
                var averageLatency = s1.calculateMeanLatency(results);
                $("#results pre").append("\r\n\r\n>> Average Latency: " + averageLatency + "ms  (single highest and single lowest value discarded).");
                callback();
            }
        });
    };
    sample(); // initiate sampling
};