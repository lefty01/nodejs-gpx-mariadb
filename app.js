var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var busboy = require('connect-busboy');
var index  = require('./routes/index');
var common = require('./routes/common');
var data   = require('./data.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// 10 MiB limit for gpx file
app.use(busboy({
    limits: {
        fileSize: 10 * 1024 * 1024
    }
})); 
// generate random session secret
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: require('crypto').randomBytes(64).toString('hex')
}))

app.use(express.static(path.join(__dirname, 'public')));

// store file upload path in session
app.use(function(req, res, next) {
    req.session.uploadPath = __dirname + '/files/';
    next();
});


app.use('/', index);


app.get('/upload', common.fileForm);
app.post('/upload', common.fileUpload);
app.get('/readfile', common.readFile);
app.get('/parsegpx', common.parseGPX);
app.get('/mariadb', common.mariadb);
app.get('/track', common.listPoints);
app.get('/xmltracks', common.xmlTracks);
app.get('/xmltracksduration', common.xmlTracksDuration);
app.get('/showmap', function (req, res) {
    res.sendfile(__dirname + '/views/maps.html');
});
app.get('/showxmlfiles', function (req, res) {
    res.sendfile(__dirname + '/views/xmltracks.html');
});
app.get('/trackinfo', common.trackInfo);




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
