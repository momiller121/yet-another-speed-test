var express = require('express');
var util = require('./util');
var app = express();

//constants
var ONE_MEGABYTE=1048576;
var MAX_PACKAGES=10;

app.set('port', (process.env.PORT || 5000));

//enable basic CORS
app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  return next();
});

//enable static HTTP published resources
app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response) {
  response.send('Yet Another Speed Test!');
});

app.get('/download', function(request, response) {
  if(util.isInt(request.query.packageSize) && parseInt(request.query.packageSize)>MAX_PACKAGES){
    response.writeHead(403, {'content-type': 'application/json'});
    response.end('{"message"::"packageSize requested exceeded maximum allowed value of '+MAX_PACKAGES+'"}');
    return;
  }
  var max = ONE_MEGABYTE*parseInt(request.query.packageSize);
  response.writeHead(200, {'Content-length': max});
  var b = new Buffer(1024);
  b.fill(0x0);
  for(var i = 0; i < max; i += 1024) {
    response.write((max - i >= 1024)?b:b.slice(0,max%1024));
  }
  response.end();
});

app.listen(app.get('port'), function() {
  console.log("yet-another-speed-test app is running at localhost:" + app.get('port'));
});
