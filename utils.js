var querystring = require('querystring');
var https = require('https');
var webshot = require('webshot');

function getBufferFromDataURL(data_Url) {

  var string = data_Url;
  var regex = /^data:.+\/(.+);base64,(.*)$/;
  var matches = string.match(regex);
  var ext = matches[1];
  var data = matches[2];

  var buffer = new Buffer(data, 'base64');

  return buffer;
}

function isEmpty(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop))
      return false;
  }

  return true;
}

function doRequest(host, endpoint, method, data, success) {
  var dataString = JSON.stringify(data);
  var headers = {};

  if (method == 'GET') {
    endpoint += '?' + querystring.stringify(data);
  } else {
    headers = {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length
    };
  }
  var options = {
    host: host,
    path: endpoint,
    method: method,
    headers: headers
  };

  var req = https.request(options, function(res) {
    res.setEncoding('utf-8');

    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
      console.log(responseString);
      var responseObject = JSON.parse(responseString);
      success(responseObject);
    });
  });

  req.write(dataString);
  req.end();
}

function removeNullFromArray(array_) {

  var return_array = [];
  for (var i = 0, len = array_.length; i < len; i++) {
    if (array_[i] != null) return_array.push(array_[i]);
  }

  return return_array;
}

function shootWeb(url, options, callback_) {

  var renderStream = webshot(url, options);

  var buf = "";

  renderStream.on('data', function(data) {

    buf += data.toString('base64');

  });

  renderStream.on('end', function() {
    console.log('OK');

    var b64 = buf;

    callback_(null, b64);

  });
}


// pushed to the client, not used for now
function generateMapParams(persons_segments) {

  var abc = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  var icon = '97';
  var pp = "";
  var coords_array = [];

  // people
  for (var i = 0, len = persons_segments.length; i < len; i++) {

    // person
    var person_segment = persons_segments[i];
    var segments = person_segment['Segments'];

    // person's segments
    for (var j = 0, lenj = segments.length; j < lenj; j++) {

      var segment = segments[j];
      var coordinates = segment['Location']['coordinates'];
      var num = j + 1;
      if (num < 10) num = '0' + j;
      else num = j + '';

      pp += '&pp=' + coordinates['lat'] + ',' + coordinates['lng'] + ';' + icon + ';' + abc[i] + num;

      coords_array.push([coordinates['lat'], coordinates['lng']])
    }

  }

  var map_update_obj = {
    'center_coord': getLatLngCenter(coords_array),
    'zoom': 15,
    'pp': pp
  }

  return map_update_obj;
}

function rad2degr(rad) {
  return rad * 180 / Math.PI;
}

function degr2rad(degr) {
  return degr * Math.PI / 180;
}

/**
 * @param latLngInDeg array of arrays with latitude and longtitude
 *   pairs in degrees. e.g. [[latitude1, longtitude1], [latitude2
 *   [longtitude2] ...]
 *
 * @return array with the center latitude longtitude pairs in
 *   degrees.
 */
function getLatLngCenter(latLngInDegr) {
  var LATIDX = 0;
  var LNGIDX = 1;
  var sumX = 0;
  var sumY = 0;
  var sumZ = 0;

  for (var i = 0; i < latLngInDegr.length; i++) {
    var lat = degr2rad(latLngInDegr[i][LATIDX]);
    var lng = degr2rad(latLngInDegr[i][LNGIDX]);
    // sum of cartesian coordinates
    sumX += Math.cos(lat) * Math.cos(lng);
    sumY += Math.cos(lat) * Math.sin(lng);
    sumZ += Math.sin(lat);
  }

  var avgX = sumX / latLngInDegr.length;
  var avgY = sumY / latLngInDegr.length;
  var avgZ = sumZ / latLngInDegr.length;

  // convert average x, y, z coordinate to latitude and longtitude
  var lng = Math.atan2(avgY, avgX);
  var hyp = Math.sqrt(avgX * avgX + avgY * avgY);
  var lat = Math.atan2(avgZ, hyp);

  return ([rad2degr(lat), rad2degr(lng)]);
}

exports.getBufferFromDataURL = getBufferFromDataURL;
exports.isEmpty = isEmpty;
exports.doRequest = doRequest;
exports.removeNullFromArray = removeNullFromArray;
exports.shootWeb = shootWeb;
exports.getLatLngCenter = getLatLngCenter;
exports.generateMapParams = generateMapParams;
