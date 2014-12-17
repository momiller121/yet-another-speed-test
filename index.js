var express = require('express');

// custom module to prep some random data
var randomBuffers = require('./randomBuffers');

// for the downloads, we'll keep 64kb of random buffer data in memory.
// we'll access this later via randomBuffers.grab()
// (we're trying to make our payloads difficult to compress enroute)
randomBuffers.generate(64);// generate 64Kb of random buffer data

var app = express();
app.enable('trust proxy') //this allows Express to collect proxy addresses

//constants
var ONE_KB=1024;
var LIMITS={upload:16};//cap acceptable upload size at 16Mb

app.set('port', (process.env.PORT || 5000));

//enable basic CORS on all routes
app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

//enable static HTTP published resources
app.use(express.static(__dirname + '/public'));

//service end point providing client access to client IP
app.get('/myip', function(request, response) {
  response.writeHead(200, {'content-type': 'application/json'});
  var ipInfo = {};
  ipInfo.ip = request.ip;
  ipInfo.ips = request.ips;
  response.end(JSON.stringify(ipInfo));
});


/* Service end point for data upload
 * Expecting POST /upload
 * If the post data is too big, we kill it.
 */
app.post('/upload', function(request, response) {
  var uploadsize = 0;
  request.on("data", function(d) {
    console.log("receiving: " + d.length + " bytes");
    uploadsize += d.length;
    if (uploadsize > ONE_KB * ONE_KB * ONE_KB) {
      var msg = "killing connection - upload was unacceptably large";
      console.log(msg);
      response.writeHead(403, {'content-type': 'application/json'});
      response.json({message:msg});
      request.connection.destroy();
      console.log("connection killed");
    }
  });

  request.on("end", function() {
    console.log("ending: "+uploadsize+" received");
    response.json({message:"I just ate "+uploadsize+" bytes"});
  });
});

/* Service end point for data download
 * Expecting GET /download/:size where :size is an explicitly acceptable value
 * If the requested value is not acceptable, the request flows through to a 404.
 */
app.get('/download/:size', function(request, response) {
  // we don't want to support arbitrary or client defined payload sizes
  // and we want to be very predictable about what we send back
  var packages = {
    _128KB:{allow:true,size:128*ONE_KB,uri:"/download/128kb"},
    _256KB:{allow:true,size:256*ONE_KB,uri:"/download/256kb"},
    _512KB:{allow:true,size:512*ONE_KB,uri:"/download/512kb"},
    _1MB:{allow:true,size:ONE_KB*ONE_KB,uri:"/download/1MB"},
    _2MB:{allow:true,size:2*ONE_KB*ONE_KB,uri:"/download/2MB"},
    _4MB:{allow:true,size:4*ONE_KB*ONE_KB,uri:"/download/4MB"},
    _8MB:{allow:true,size:8*ONE_KB*ONE_KB,uri:"/download/1MB"},
    _16MB:{allow:true,size:16*ONE_KB*ONE_KB,uri:"/download/1MB"}
  };

  var packageSize = "_"+request.params.size.toUpperCase().trim();

  // test for acceptability
  if(!packages[packageSize]){
    response.writeHead(403, {'content-type': 'application/json'});
    response.json({code:403,message:"Forbidden",supported:packages});
    return;
  }

  var max = packages[packageSize].size;
  response.writeHead(200, {'Content-length': max});

  for(var i = 0; i < max; i += 1024) {
    var b = randomBuffers.grab(); //1kb of random randomness
    response.write((max - i >= 1024)?b:b.slice(0,max%1024));
  }
  response.end();
});

app.listen(app.get('port'), function() {
  console.log("yet-another-speed-test app is running at localhost:" + app.get('port'));
});
