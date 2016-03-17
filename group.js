var key = process.env.AZURE_FACE_KEY;

var oxford = require('project-oxford'),
  client = new oxford.Client(key);

var async = require('async');
var uuid = require('uuid');

function find(name_to_find, callback_) {

  console.log('Name to find: ' + name_to_find);

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

        client.face.personGroup.list()
          .then(function(response) {
            var groups = response;

            console.log('Groups: ' + JSON.stringify(groups));

            if (groups.length == 0) finalResult(null, {
              'result': null
            });

            var found_group = null;

            for (var i = 0, len = groups.length; i < len; i++) {

              var group = groups[i];

              console.log('Group being checked: ' + JSON.stringify(group));

              if (group['name'].toUpperCase() == name_to_find.toUpperCase()) {
                found_group = group;
                break;
              }
            }

            callback(null, found_group);
          })
          .catch(function(error) {
            console.log('List group error: ' + JSON.stringify(error));
            callback(error, null);
          });
      }
    ],
    finalResult
  );
}

function create(name, callback_) {

  var personGroupUUID = uuid.v4();
  client.face.personGroup.create(
    personGroupUUID,
    name,
    'test-' + name
  ).then(function(response) {
    console.log('Group create response: ' + JSON.stringify(response));
    if (typeof(response) == 'undefined') callback_(null, personGroupUUID); // undefined is good???
    else(callback_({
      'Error': 'personGroup.create error'
    }, null));
  }).catch(function(error) {
    console.log('Error:' + JSON.stringify(error));
    callback(error, null);
  });

}

exports.find = find;
exports.create = create;
