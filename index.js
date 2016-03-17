var express = require('express');
var app = express();
var auth = require('./auth')(app);
var group = require('./group.js');
var person = require('./person.js');
var face = require('./face.js');
var concur = require('./concur.js');
var utils = require('./utils.js');
var streamifier = require('./streamifier.js');

var bing_api_key = process.env.BING_API_KEY;

var bodyParser = require('body-parser');
app.use(bodyParser.json({
  limit: '50mb'
})); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
})); // to support URL-encoded bodies

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/kiosk', function(request, response) {

  var group_id = request.query.g;

  response.render('pages/kiosk', {
    'group_id': group_id
  });
});

app.use('/scripts', express.static(__dirname + '/scripts'));
app.use('/styles', express.static(__dirname + '/styles'));

var authRouter = require('./routes/auth')(express, auth);
app.use('/auth', authRouter);

var homeRouter = require('./routes/home')(express, auth, __dirname);
app.use('/', homeRouter);

var global_buffer; // <---- DELETE

app.post('/getSegments', function(request, response) {

  console.log('[/getSegments request.body]: ' + JSON.stringify(request.body))

  var person_details = request.body.person_details;
  //console.log('[/getSegments person_details]: ' + person_details);

  concur.addSegmentsToPersons(person_details, function(err, result) {
    if (err) {
      console.log('[/getSegments error]: ' + JSON.stringify(err));
      response.send(err);
    } else {
      console.log('[concur.addSegmentsToPersons]: ' + JSON.stringify(result));
      response.send(result);
    }
  });
});

app.get('/findGroup', function(request, response) {

  var domain = request.query.domain;

  group.find(domain, function(err, data) {
    if (err) response.send(err);
    else response.send(data);
  });

});

app.post('/createGroup', function(request, response) {

  var group_name = request.body.name;

  group.create(group_name, function(err, data) {

    if (err) response.send(err);
    else response.send(data);
  });
});

app.post('/createPerson', function(request, response) {

  var group_id = request.body.group_id;
  var name_id = request.body.name_id;
  var access_token = request.body.access_token;
  var f_name = request.body.f_name;
  var l_name = request.body.l_name;

  var create_obj = {
    'group_id': group_id,
    'name_id': name_id,
    'access_token': access_token,
    'f_name': f_name,
    'l_name': l_name
  }

  person.create(create_obj, function(err, data) {

    console.log('[/createPerson]: ' + JSON.stringify(data));

    if (err) response.send(err);
    else response.send(data);
  });
});

app.get('/findPerson', function(request, response) {

  console.log('findPerson: ' + JSON.stringify(request.query));

  var name_id = request.query.name_id;
  var group_id = request.query.group_id;
  var find_obj = {
    'name_id': name_id,
    'group_id': group_id
  }

  person.find(find_obj, function(err, data) {
    if (err) {
      console.log('[/findPerson error]' + JSON.stringify(err));
      response.send(err);
    } else {
      console.log('[/findPerson response]: ' + JSON.stringify(data));
      response.send(data);
    }
  });
});

app.post('/uploadFace', function(request, response) {

  var data_Url = request.body.data_Url;
  var access_token = request.body.access_token;
  var login_id = request.body.login_id;
  var group_id = request.body.group_id;
  var first_name = request.body.first_name;
  var last_name = request.body.last_name;
  var person_id = request.body.person_id;

  console.log(request.body.login_id);

  var buffer = utils.getBufferFromDataURL(data_Url);
  var stream = streamifier.createReadStream(buffer);

  var add_image_buffer = utils.getBufferFromDataURL(data_Url);
  var add_image_stream = streamifier.createReadStream(add_image_buffer);

  face.detect2(stream, function(err, data) {

    if (err) {
      console.log('[face.detect2 error]: ' + JSON.stringify(err));
      response.send(err);
      return;
    }

    if (data.hasOwnProperty('faceId')) {


      var obj_to_add = {

        'group_id': group_id,
        'person_id': person_id,
        //'stream'   : stream,
        'first_name': first_name,
        'last_name': last_name

      }

      face.addFace(obj_to_add, add_image_stream, function(err, data) {
        // training response
        if (err) {
          response.send(err);
          return;
        } else {
          console.log('[/uploadFace addFace]: ' + JSON.stringify(data));
          response.send(data);
        }
      });
    } else {

      console.log('[face.detect2]: ' + JSON.stringify(data));
      response.send(data);
    }
  });
});

app.post('/identify', function(request, response) {

  var data_Url = request.body.data_Url;
  var group_id = request.body.group_id;

  face.overrideGroupId(group_id);

  var buffer = utils.getBufferFromDataURL(data_Url);
  var stream = streamifier.createReadStream(buffer);

  face.detectMulti(stream, function(err, data) {

    if (err) {
      response.send(err);
    } else {
      console.log('[/identify response]: ' + data);
      response.send(data);
    }

  });
});

app.post('/personUpdate', function(request, response) {

  var update_obj = {
    'group_id': request.body.group_id,
    'person_id': request.body.person_id,
    'person_name': request.body.person_name,
    'access_token': request.body.access_token,
    'f_name': request.body.f_name,
    'l_name': request.body.l_name,
  }

  person.update(update_obj, function(err, data) {

    if (err) {
      response.send(err);
    } else {
      console.log('[/personUpdate response]');
      response.send(data);
    }

  });

});

app.post('/deleteAllFaces', function(request, response) {

  var group_id = request.body.group_id;
  var person_id = request.body.person_id;
  var persisted_face_ids = request.body.persisted_face_ids;

  var delete_obj = {
    'group_id': group_id,
    'person_id': person_id,
    'persisted_face_ids': persisted_face_ids
  }

  face.deleteAllFaces(delete_obj, function(err, result) {

    if (err) {
      response.send(err);
      return;
    } else {
      response.send(result);
    }
  });

});

app.post('/updateMap', function(request, response) {

  var coordinates = request.body.coordinates;

  var options = {
    siteType: 'url',
    shotSize: {
      width: '780',
      height: '600'
    }
  };

  var url = "https://dev.virtualearth.net/REST/v1/Imagery/Map/Road/" + coordinates + "/15?mapSize=780,600&pp=" + coordinates + ";97&key=AmuUaS7LrRHatK3ChKiM7nbtTxnMDiMfcefCGvynsHiiU1odU2f3kOI42UQd48Ff";

  utils.shootWeb(url, options, function(err, result) {

    var b64 = result;

    response.writeHead(200, {
      //'Content-Type': 'image/jpg',
      'Content-Length': Buffer.byteLength(b64, 'utf8')
    });

    //response.end(b64, 'base64');
    response.end(b64, 'utf8');

  });

});

app.post('/generateMap', function(request, response) {

  //var persons_segments = request.body.persons_segments;
  var map_update_obj = request.body.map_update_obj;

  var options = {
    siteType: 'url',
    shotSize: {
      width: '780',
      height: '600'
    }
  };

  //var url = "https://dev.virtualearth.net/REST/v1/Imagery/Map/Road/47.619048,-122.35384/15?mapSize=780,600&pp=47.620495,-122.34931;21;AA&pp=47.619385,-122.351485;;AB&pp=47.616295,-122.3556;22&key=AmuUaS7LrRHatK3ChKiM7nbtTxnMDiMfcefCGvynsHiiU1odU2f3kOI42UQd48Ff";
  var url = "https://dev.virtualearth.net/REST/v1/Imagery/Map/Road/" +
    //map_update_obj['center_coord'][0] + "," +
    //map_update_obj['center_coord'][1] + "/" +
    //map_update_obj['zoom'] +
    "?mapSize=" +
    options['shotSize']['width'] + "," +
    options['shotSize']['height'] +
    map_update_obj['pp'] +
    "&dcl=1" +
    "&key=" + bing_api_key;

  console.log('map url: ' + url);

  utils.shootWeb(url, options, function(err, result) {

    var b64 = result;

    response.writeHead(200, {
      //'Content-Type': 'image/jpg',
      'Content-Length': Buffer.byteLength(b64, 'utf8')
    });

    //response.end(b64, 'base64');
    response.end(b64, 'utf8');

  });
});

app.get('/getTestBuffer', function(request, response) {
  //response.render('pages/index');

  response.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': Buffer.byteLength(global_buffer, 'utf8')
  });

  response.end(global_buffer, 'base64');
  //response.end(b64, 'utf8');
});

app.get('/test', function(request, response) {
  face.runTest(function(err, data) {
    response.send(data);
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
