var key = process.env.AZURE_FACE_KEY;
var override_group_id = process.env.OVERRIDE_GROUP_ID; //@concur.com

var oxford = require('project-oxford'),
  client = new oxford.Client(key);

var person = require('./person.js');
var utils = require('./utils.js');

var async = require('async');

function overrideGroupId(group_id) {

  if (group_id) override_group_id = group_id;
}

function detect(image_stream, callback_) {

  var finalResult = function(err, result) {

    if (!err) {
      console.log("Result is: " + JSON.stringify(result));
      callback_(null, result);
    } else {
      console.log('Error: ' + JSON.stringify(err));
      callback_(err, null);
    }
  }

  async.waterfall([

      function(callback) {
        client.face.detect({
            //url: 'https://concurlabs.com/images/team/ChrisIsmael.jpg',
            //url: 'https://concurlabs.com/images/team/LanceHughes.jpg',
            //url: 'https://concurlabs.com/images/team/ChristopherTrudeau.jpg',
            //url: 'https://static.sched.org/a2/834595/avatar.jpg.320x320px.jpg',
            //url: 'https://cdn-images-1.medium.com/fit/c/100/100/0*TAmpBBJLfb86KXt5.jpg',
            stream: image_stream,
            returnFaceId: true
              //analyzesFaceLandmarks: true,
              //analyzesAge: true,
              //analyzesFacialHair: true,
              //analyzesGender: true,
              //analyzesHeadPose: true,
              //analyzesSmile: true
          })
          .then(function(response) {

            if (response.length == 0)
            //callback('NO_FACE_DETECTED', null);
              finalResult(null, {
              'result': 'NO_FACE_DETECTED'
            });
            else {

              console.log('Detect response: ' + JSON.stringify(response));

              if (response[0].hasOwnProperty('faceId'))
                callback(null, response[0]);
              else
                finalResult(null, {
                  'result': 'NO_FACE_ID_ON_DETECT'
                });
            }

          })
          .catch(function(error) {
            console.log('Detect error: ' + error);
            callback(error, null);
          });
      },

      // identify if face is in person group
      function(obj, callback) {
        console.log('Testing faceId: ' + obj.faceId);
        client.face.identify(
            [obj.faceId],
            person_group_id,
            1
          )
          .then(function(response) {

            console.log('Identify response: ' + JSON.stringify(response));
            var candidates = response[0].candidates;

            if ((candidates.length) > 0 && candidates[0].hasOwnProperty('personId')) {
              callback(null, candidates[0].personId);
            } else finalResult(null, {
              'result': 'FACE_NOT_RECOGNIZED'
            })

          })
          .catch(function(error) {
            console.log('Identify error - ' + JSON.stringify(error));
            callback(error, null);
          });
      },
      // get identified person details
      function(person_id, callback) {
        client.face.person.get(person_group_id, person_id)
          .then(function(response) {
            callback(null, {
              'result': response
            });
          })
          .catch(function(error) {
            callback(error, null);
          });
      }
    ],
    finalResult
  );

}

function detect2(image_stream, callback_) {

  var finalResult = function(err, result) {

    if (!err) {
      console.log("Result is: " + JSON.stringify(result));
      callback_(null, result);
    } else {
      console.log('detect2 Error: ' + JSON.stringify(err));
      callback_(err, null);
    }
  }

  async.waterfall([

      function(callback) {
        client.face.detect({
            //url: 'https://concurlabs.com/images/team/ChrisIsmael.jpg',
            //url: 'https://concurlabs.com/images/team/LanceHughes.jpg',
            //url: 'https://concurlabs.com/images/team/ChristopherTrudeau.jpg',
            //url: 'https://static.sched.org/a2/834595/avatar.jpg.320x320px.jpg',
            //url: 'https://cdn-images-1.medium.com/fit/c/100/100/0*TAmpBBJLfb86KXt5.jpg',
            stream: image_stream,
            returnFaceId: true
              //analyzesFaceLandmarks: true,
              //analyzesAge: true,
              //analyzesFacialHair: true,
              //analyzesGender: true,
              //analyzesHeadPose: true,
              //analyzesSmile: true
          })
          .then(function(response) {

            if (response.length == 0)
            //callback('NO_FACE_DETECTED', null);
              finalResult(null, {
              'result': 'NO_FACE_DETECTED'
            });
            else {

              console.log('Detect2 response: ' + JSON.stringify(response));

              if (response[0].hasOwnProperty('faceId')) {
                console.log('Response with faceId: ' + JSON.stringify(response[0]));
                callback(null, response[0]);
              } else
                finalResult(null, {
                  'result': 'NO_FACE_ID_ON_DETECT'
                });
            }

          })
          .catch(function(error) {
            console.log('Detect error: ' + error);
            callback(error, null);
          });
      }
    ],
    finalResult
  );
}

function detectMulti(image_stream, callback_) {

  var finalResult = function(err, result) {

    if (!err) {
      console.log("Result is: " + JSON.stringify(result));
      callback_(null, result);
    } else {
      console.log('detectMulti Error: ' + JSON.stringify(err));
      callback_({
        'result': err
      }, null);
    }
  }

  var getPersonId = function(item, callback) {

    var face_person = item;
    var person_id = null;
    if (face_person['candidates'].length > 0) {
      person_id = face_person['candidates'][0]['personId'];
    }
    callback(null, person_id);

  }

  //var get_access_tokens = function(item, callback) {
  var get_person_detail = function(item, callback) {

    var person_id = item;
    if (person_id) { // not null

      var get_obj = {
        'person_id': person_id,
        'group_id': override_group_id
      }

      person.getDetail(get_obj, function(err, result) {

        var person_detail = result;
        /*
        var access_token = person_detail['userData'];
        callback(null, access_token);
        */
        callback(null, person_detail);
      });
    } else {
      callback(null, null);
    }

  }

  async.waterfall([

      function(callback) {
        client.face.detect({
            stream: image_stream,
            returnFaceId: true
              //analyzesFaceLandmarks: true,
              //analyzesAge: true,
              //analyzesFacialHair: true,
              //analyzesGender: true,
              //analyzesHeadPose: true,
              //analyzesSmile: true
          })
          .then(function(response) {

            if (response.length == 0)
            //callback('NO_FACE_DETECTED', null);
              finalResult(null, {
              'result': 'NO_FACE_DETECTED'
            });
            else {

              console.log('DetectMulti response: ' + JSON.stringify(response));

              if (response[0].hasOwnProperty('faceId')) {
                console.log('Response with faceId: ' + JSON.stringify(response));

                var array_of_faceIds = [];

                for (var i = 0, len = response.length; i < len; i++) {
                  var face_id = response[i]['faceId'];
                  array_of_faceIds.push(face_id);
                }

                callback(null, array_of_faceIds);
              } else
                finalResult(null, {
                  'result': 'NO_FACE_ID_ON_DETECT'
                });
            }
          })
          .catch(function(error) {
            console.log('Detect error: ' + error);
            callback(error, null);
          });
      },

      // identify if face is in person group
      function(array_of_ids, callback) {

        console.log('Testing array of faceIds: ' + JSON.stringify(array_of_ids));

        client.face.identify(
            array_of_ids,
            override_group_id,
            5
          )
          .then(function(response) {

            console.log('Identify response: ' + JSON.stringify(response));

            // if there's even one candidate...
            var candidates = response[0].candidates;

            if ((candidates.length) > 0 && candidates[0].hasOwnProperty('personId')) {
              //callback(null, candidates[0].personId);
              callback(null, response);
            } else finalResult(null, {
              'result': 'FACE_NOT_RECOGNIZED'
            })

            /*
            if(response.length > 0) {
            	callback(null, response);
            }
            else {
            	finalResult(null, { 'result' : 'FACE_NOT_RECOGNIZED' });
            }
            */

          })
          .catch(function(error) {
            console.log('Identify error - ' + JSON.stringify(error));
            callback(error, null);
          });
      },

      function(array_of_face_persons, callback) {

        async.map(array_of_face_persons, getPersonId, function(err, results) {
          if (err) {
            callback(err, null);
          } else {
            console.log('[get_person_ids]: ' + JSON.stringify(results));
            callback(null, results);
          }
        });
      },

      function(array_of_personIds, callback) {

        var cleaned = utils.removeNullFromArray(array_of_personIds);

        async.map(cleaned, get_person_detail, function(err, results) {
          if (err) {
            callback(err, null);
          } else {
            console.log('[get_person_detail]: ' + JSON.stringify(results));
            callback(null, results);
          }
        });

      }
    ],
    finalResult
  );

}


function addFace(obj_to_add, image_stream, callback_) {

  console.log('[face.addFace obj_to_add]: ' + JSON.stringify(obj_to_add));

  var group_id = obj_to_add['group_id'];
  var person_id = obj_to_add['person_id'];
  //var stream    = obj_to_add['stream'];
  var first_name = obj_to_add['first_name'];
  var last_name = obj_to_add['last_name'];

  var finalResult = function(err, result) {

    if (!err) {
      console.log("Result is: " + JSON.stringify(result));
      callback_(null, result);
    } else {
      console.log('[face.addFace Error]: ' + JSON.stringify(err));
      callback_(err, null);
    }
  }

  async.waterfall([

      // Add image to Person
      function(callback) {
        client.face.person.addFace(group_id, person_id, {
            stream: image_stream,
            userData: first_name + '_' + last_name
          })
          .then(function(response) {
            var personPersistedFaceId = response.persistedFaceId;
            var var_to_pass = group_id // #debug
            console.log('Person Group ID: ' + var_to_pass);
            callback(null, var_to_pass);
          })
          .catch(function(error) {
            console.log('[addFace.addFace Error]: ' + JSON.stringify(error));
            callback(error, 'error');
          });
      },
      // train person object
      function(group_id, callback) {
        client.face.personGroup.trainingStart(group_id)
          .then(function(response) {
            console.log('[addFace training response]: ' + response);
            callback(null, response);
          }).catch(function(error) {
            console.log('[addFace training Error]: ' + JSON.stringify(error));
            callback(error, null);
          });
      }
    ],
    finalResult
  );
}

function deleteAllFaces(delete_obj, callback_) {

  var group_id = delete_obj['group_id'];
  var person_id = delete_obj['person_id'];
  var persisted_face_ids = delete_obj['persisted_face_ids'];

  var delete_persisted_faces = function(item, callback) {

    var persisted_face_id = item;

    client.face.person.deleteFace(group_id, person_id, persisted_face_id)
      .then(function(response) {
        //assert.ok(true, "void response expected");
        callback(null, 'ok');
      })
      .catch(function(error) {
        console.log('[deleteFace error]: ' + JSON.stringify(error));
        callback(error, null);
      });

  }

  async.map(persisted_face_ids, delete_persisted_faces, function(err, results) {
    if (err) {
      callback_(err, null);
    } else {
      callback(null, results);
    }
  });

}

function runTest(callback_) {

  async.waterfall([
    // check training status
    function(callback) {
      client.face.personGroup.trainingStatus(person_group_id)
        .then(function(response) {
          console.log(JSON.stringify(response));
          if (response.status == "succeeded") callback(null, 'ok');
          else callback("error", "not yet trained");
        })
        .catch(function(error) {
          callback(error.code, JSON.stringify(error));
        });

    },
    // detect face from new picture, get face id
    function(obj, callback) {
      client.face.detect({
          //url: 'https://concurlabs.com/images/team/ChrisIsmael.jpg',
          //url: 'https://concurlabs.com/images/team/LanceHughes.jpg',
          //url: 'https://concurlabs.com/images/team/ChristopherTrudeau.jpg',
          //url: 'https://static.sched.org/a2/834595/avatar.jpg.320x320px.jpg',
          url: 'https://cdn-images-1.medium.com/fit/c/100/100/0*TAmpBBJLfb86KXt5.jpg',
          returnFaceId: true,
          analyzesFaceLandmarks: true,
          analyzesAge: true,
          analyzesFacialHair: true,
          analyzesGender: true,
          analyzesHeadPose: true,
          analyzesSmile: true
        })
        .then(function(response) {
          callback(null, response[0])
        })
        .catch(function(error) {
          callback(error, JSON.stringify(error));
        });
    },
    // identify if face is in person group
    function(obj, callback) {
      console.log('Testing faceId: ' + obj.faceId);
      client.face.identify(
          [obj.faceId],
          person_group_id,
          1
        )
        .then(function(response) {
          callback(null, response);
        })
        .catch(function(error) {
          callback(error, JSON.stringify(error));
        });
    },
    // get identified person details
    function(obj, callback) {
      client.face.person.get(person_group_id, obj[0].candidates[0].personId)
        .then(function(response) {
          callback(null, response);
        })
        .catch(function(error) {
          callback(null, JSON.stringify(error));
        });
    }
  ], function(err, result) {
    // result now equals 'done'
    console.log("Result is: " + JSON.stringify(result));
    callback_(null, JSON.stringify(result));
  });
}
//exports.runTest = runTest;
exports.detect = detect;
exports.detect2 = detect2;
exports.addFace = addFace;
exports.deleteAllFaces = deleteAllFaces;
exports.detectMulti = detectMulti;
exports.overrideGroupId = overrideGroupId;
