var express = require('express');
var crypto = require('crypto');
var util = require('./util');

var app = express();
app.enable('trust proxy') //this allows Express to collect proxy addresses

//constants
var ONE_KB=1024;

app.set('port', (process.env.PORT || 5000));

app.use(function(req, res, next) {
  //enable basic CORS
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


//service end point providing client access to client IP
app.post('/upload', function(request, response) {
  var uploadsize = 0;
  request.body = new Buffer(0);
  request.on("data", function(d) {
    console.log("receiving: " + d.length + " bytes");
    uploadsize += d.length;
    if (uploadsize > ONE_KB * ONE_KB * ONE_KB) {
      console.log("killed connection - upload was unacceptably large");
      response.end("bar");
      request.connection.destroy();
    }
    request.body = Buffer.concat([request.body, d], (request.body.length + d.length));
  });

  request.on("end", function() {
    console.log("ending: "+uploadsize+" received");
    response.end();
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
    var err = {code:403,message:"Forbidden",supported:packages};
    response.end(JSON.stringify(err));
    return;
  }

  var max = packages[packageSize].size;
  response.writeHead(200, {'Content-length': max});
  var b = new Buffer(crypto.pseudoRandomBytes(1024)); //1kb of randomness
  for(var i = 0; i < max; i += 1024) {
    response.write((max - i >= 1024)?b:b.slice(0,max%1024));
  }
  response.end();
});

app.listen(app.get('port'), function() {
  console.log("yet-another-speed-test app is running at localhost:" + app.get('port'));
});
