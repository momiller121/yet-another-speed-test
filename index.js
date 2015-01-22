var utils = require('./util');
var express = require('express');
var uuid = require('node-uuid');

//before we load the logger, make sure we have the directory we need
utils.ensureExists(__dirname + '/logs', 0744, function(err) {
  if (err) {console.log("Error trying to create logging directory : "+err.message);}
});

var config = require('./config');
var randomBuffers = require('./randomBuffers');
var log = config.accesslog;
var serverlog = config.serverlog;

serverlog.info('Server starting up');
var http = require('http');
http.globalAgent.maxSockets = 100;

// for the downloads, we'll keep 64kb of random buffer data in memory.
// we'll access this later via randomBuffers.grab()
// (we're trying to make our payloads less compressable enroute)
randomBuffers.generate(randomBuffers.size);// generate 4MB (64x64kB) of random buffer data in memory

var app = express();
app.enable('trust proxy') //this allows Express to collect proxy addresses

app.set('port', (process.env.PORT || 5000));

// Client authorization [protect the upload and download resources]
function restrict(req, res, next) {
  if (utils.ipInRange(config,req.ip)) {
    next();
  } else {
    serverlog.info("Denied client based on IP range: " +req.ip+ " is not expressed in ranges: "+config.authorizedRanges);
    res.status(403).json({message:"client unauthorized"});
  }
}

//enable CORS and logging middleware on all routes
app.use(function(req, res, next) {
  var start = Date.now();
  res.setHeader("Access-Control-Allow-Origin", "*");
  req.req_id = uuid.v4();                // augment HTTP request with a UUID
  if(!req.connection.customId){          // if it doesn't already have one
    req.connection.customId = uuid.v4(); //   augment the http connection with a UUID
  }                                      //   (http keep-alive lets us track per connection)
  log.info({req: req}, 'request start'); // log the HTTP request
  res.on('finish', function() {          // log the HTTP response on the finish event
    log.info({ inResponseTo: req.req_id, res: res, duration: Date.now() - start }, 'request finish');
  })
  next();
});

// for now, 302 to the client page
app.get('/', function(request, response) {
  response.redirect("client.html");
});

//enable static HTTP published resources
app.use(express.static(__dirname + '/public'));

//service end point providing client access to client IP
app.get('/myip', function(request, response) {
  response.json({ip:request.ip,ips:request.ips});
});

//service end point providing HTTP:HEAD support as a convenience method to test if the client is authorized to access.
app.head('/authcheck', restrict, function(request, response) {
  response.status(200).end();
});

/* Service end point for data upload
 * Expecting POST /upload
 * If the post data is too big, we kill it.
 * (Data POSTed here is black-holed)
 */
app.post('/upload', restrict, function(request, response) {
  var uploadsize = 0;
  request.on("data", function(d) {
    uploadsize += d.length;
    d = null; //dump the content
    if (uploadsize > config.upload.maxPayload) {
      var msg = "killing connection - upload was unacceptably large";
      serverlog.info(msg); //TODO - need to look at logging output for error case
      response.status(403).json({message:msg});
      request.connection.destroy();
      return;
    }
  });

  request.on("end", function() {
    var msg = "I just ate "+uploadsize+" bytes";
    response.json({message:msg});
  });
});

/*
 * Allow the client to discover the supported download packages
 */
app.get('/download/packages', function(request, response) {
  response.json(config.download.packages);
});

/* Service end point for data download
 * Expecting GET /download/:size where :size is an explicitly acceptable value
 * If the requested value is not acceptable, the request flows through to a 404.
 */
app.get('/download/:size', restrict, function(request, response) {
  var packages = config.download.packages;
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
  var cpuCount = require('os').cpus().length;
  serverlog.info("yet-another-speed-test app is running at localhost:" + app.get('port'));
  serverlog.info("cpuCount: "+cpuCount);
});