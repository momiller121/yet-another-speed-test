var express = require('express');
var config = require('./config');
var randomBuffers = require('./randomBuffers');

// for the downloads, we'll keep 64kb of random buffer data in memory.
// we'll access this later via randomBuffers.grab()
// (we're trying to make our payloads difficult to compress enroute)
randomBuffers.generate(randomBuffers.size);// generate 4Mb of random buffer data in memory

var app = express();
app.enable('trust proxy') //this allows Express to collect proxy addresses

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
  response.json({ip:request.ip,ips:request.ips});
});


/* Service end point for data upload
 * Expecting POST /upload
 * If the post data is too big, we kill it.
 */
app.post('/upload', function(request, response) {
  var uploadsize = 0;
  request.on("data", function(d) {
    uploadsize += d.length;
    if (uploadsize > config.upload.maxPayload) {
      var msg = "killing connection - upload was unacceptably large";
      console.log(msg);
      response.status(403).json({message:msg});
      request.connection.destroy();
      return;
    }
  });

  request.on("end", function() {
    response.json({message:"I just ate "+uploadsize+" bytes"});
  });
});

/* Service end point for data download
 * Expecting GET /download/:size where :size is an explicitly acceptable value
 * If the requested value is not acceptable, the request flows through to a 404.
 */
app.get('/download/:size', function(request, response) {
  var packages = config.packages;
  var packageSize = "_"+request.params.size.toUpperCase().trim();

  // test for acceptability
  if(!packages[packageSize]){
    response.status(403).json({code:403,message:"Forbidden",supported:packages});
    return;
  }

  var max = packages[packageSize].size;
  response.writeHead(200, {'Content-length': max});

  var bufSize=(randomBuffers.size*1024);
  for(var i = 0; i < max; i += bufSize) {
    var b = randomBuffers.grab(); //64kb of random randomness
    response.write((max - i >= bufSize)?b:b.slice(0,max%bufSize));
  }
  response.end();
});

app.listen(app.get('port'), function() {
  console.log("yet-another-speed-test app is running at localhost:" + app.get('port'));
});
