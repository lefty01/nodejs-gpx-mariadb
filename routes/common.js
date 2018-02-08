
var util = require('util');
var fs = require('fs');
var xml2js = require('xml2js');

var testFilePath = '/home/rasmus/nodegpxmariadb/public/uploads/3987-dh6yc5.gpx';
 
exports.fileForm = function(req, res) {
    res.render('upload', {
        title: 'Upload File'
    });
};
 
exports.fileUpload = function(req, res) {
    var fstream;
    var fsize = 0;
    var limit_reached = 0;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        console.log("Uploading: " + filename + " to: " + req.session.uploadPath);
	console.log("filename length: " + filename.length);
	console.log("file mimetype: " + mimetype);
	console.log("file encoding: " + encoding);

	// check mimetype ? / extension to only allow gpx files?
	file.on('data', function(data) {
	    console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
	    fsize += data.length;
	});

	// check for file size limit (currently 10MiB)
        file.on('limit', function() {
            console.log('file size limit reached!!!');
            //delete incomplete file
            fs.unlink(req.session.uploadPath + filename, function(err) {
		if (err) {
		    console.log("ERROR: unlink failed for file: " +
				req.session.uploadPath + filename);
		}
	    });
	    limit_reached = 1;
        });

        fstream = fs.createWriteStream(req.session.uploadPath + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
	    // check if size zero
	    if (fsize == 0) {
		console.log('file size is zero!!!');
		fs.unlink(req.session.uploadPath + filename, function(err) {
		    if (err) {
			console.log("ERROR: unlink failed for file: " +
				    req.session.uploadPath + filename);
		    }
		});
		res.send('ERROR: file has size of zero!');
            }
	    else if (limit_reached) {
		res.send('ERROR: file too large (limit is 10MB)!');
	    }
	    else {
		res.send(util.format('Upload complete!\nuploaded %s (%d Kb)',
				     filename, fsize / 1024));
	    }
	});
    });
}

exports.readFile = function(req, res) {
    fs.readFile(testFilePath, 'ascii', function (err, data) {
	if (err) {
	    res.send(err);
	};
	res.send(data);
    });
};

exports.parseGPX = function(req, res) {
    var data = require('../data.js');
    var json = '';

    try {
	// read (last?) uploaded file
	var fileData = fs.readFileSync(req.session.uploadedFile, 'ascii');
	var parser = new xml2js.Parser();
	parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
	    json = result;
	});

	var debug = '';
	var lon = null;
	var lat = null;

	data.connect();

	for(var i in json.gpx.trk[0].trkseg[0].trkpt) {
	    lon = json.gpx.trk[0].trkseg[0].trkpt[i].$.lon;
	    lat = json.gpx.trk[0].trkseg[0].trkpt[i].$.lat;
	    data.insertPoint(lon, lat);
	    
	    debug += "lon: " + lon + " - ";
	    debug += "lat: " + lat + "\n";
	}

	data.disconnect();

	res.send(debug);
    } catch (ex) {
	res.send(ex);
    };
};

exports.mariadb = function(req, res) {
    var data = require('../data.js');

    data.connect();
    data.disconnect();

    res.send("Connected and disconnected from MariaDB!");
};

exports.listPoints = function(req, res) {
    var data = require('../data.js');

    data.connect();
    data.getTrackPoints(1, res);
}

exports.xmlTracks = function(req, res) {
    var data = require('../data.js');

    data.connect();
    data.getXMLTracks(res);
}

exports.xmlTracksDuration = function(req, res) {
    var data = require('../data.js');

    data.connect();
    data.getXMLTracksDuration(res);
}

exports.trackInfo = function(req, res) {
    var data = require('../data.js');

    data.connect();
    console.log("trackId: " + req.param("trackId"));
    data.getDistance(req.param("trackId"), res);
}

