var key = process.env.AZURE_FACE_KEY;

var oxford = require('project-oxford'),
  client = new oxford.Client(key);

var async = require('async');
var uuid = require('uuid');

function find(find_obj, callback_) {

  //console.log('Name to find: ' + name_to_find);
  var name_id = find_obj['name_id'];
  var group_id = find_obj['group_id'];

  var finalResult = function(err, result) {

    if (!err) {
      console.log("[person.find Result]: " + JSON.stringify(result));
      callback_(null, result);
    } else {
      console.log('[person.find finalResult Error]: ' + JSON.stringify(err));
      callback_(err, null);
    }
  }

  async.waterfall([

      function(callback) {

        client.face.person.list(group_id)
          /*
          .then(function (response) {
              assert.equal(response.length, 1);
              assert.equal(response[0].personId, billPersonId);
              assert.equal(response[0].name, 'test-bill2');
              assert.equal(response[0].userData, 'test-data2');
              assert.ok(!response[0].persistedFaceIds || response[0].persistedFaceIds.length == 0);
              done();
          })
          */
          .then(function(response) {
            var people = response;

            console.log('People: ' + JSON.stringify(people));

            if (people.length == 0) {
              finalResult(null, {
                'result': null
              });
              return;
            }

            var found_person = {
              'result': null
            };

            for (var i = 0, len = people.length; i < len; i++) {

              var person = people[i];

              console.log('Person being checked: ' + JSON.stringify(person) + ' against ' + name_id);

              if (person['name'].toUpperCase() == name_id.toUpperCase()) {
                found_person = person;
                break;
              }
            }

            callback(null, found_person);
          })
          .catch(function(error) {
            console.log('List people error: ' + JSON.stringify(error));
            callback(error, null);
          });
      }
    ],
    finalResult
  );
}

function create(create_obj, callback_) {

  var group_id = create_obj['group_id'];
  var name_id = create_obj['name_id'];
  var misc_data = JSON.stringify({
    'access_token': create_obj['access_token'],
    'f_name': create_obj['f_name'],
    'l_name': create_obj['l_name']
  });

  var finalResult = function(err, result) {

    if (!err) {
      console.log("[person.create Result]: " + JSON.stringify(result));
      callback_(null, result);
    } else {
      console.log('[person.create finalResult Error]: ' + JSON.stringify(err));
      callback_(err, null);
    }
  }

  async.waterfall([

      function(callback) {

        // Create Person
        client.face.person.create(
            group_id,
            name_id, // ---> This is '.name', as in chris.ismael@gmail.com
            misc_data)
          .then(function(response) {

            console.log('[person.create.then]: ' + JSON.stringify(response));

            var person_id = response.personId;

            var personObject = {
              //	 group_id : personGroupUUID,
              personId: person_id,
              name: name_id
            }
            callback(null, personObject);
          })
          .catch(function(error) {
            console.log('Error: ' + JSON.stringify(error));
            callback(error, 'error');
          });

      }
    ],

    finalResult
  );
}

function update(update_obj, callback_) {

  var group_id = update_obj['group_id'];
  var person_id = update_obj['person_id'];
  var person_name = update_obj['person_name'];
  var person_data = JSON.stringify({
    'access_token': update_obj['access_token'],
    'f_name': update_obj['f_name'],
    'l_name': update_obj['l_name']
  });

  console.log('[person.update person_data]: ' + person_data);

  // TODO: Investigate this - NOT WORKING

  client.face.person.update(group_id, person_id, person_name, person_data)
    .then(function(response) {
      /*
      assert.ok(true, "void response expected");
      done();
      */
      callback_(null, 'update_ok');
    })
    .catch(function(error) {
      callback_(error, null);
    });

}

function getDetail(get_obj, callback_) {

  var group_id = get_obj['group_id'];
  var person_id = get_obj['person_id'];

  client.face.person.get(group_id, person_id)
    .then(function(response) {
      /*
      assert.equal(response.personId, billPersonId);
      assert.equal(response.name, 'test-bill');
      assert.equal(response.userData, 'test-data');
      done();
      */
      console.log('[getDetail]: ' + response);
      callback_(null, response);
    })
    .catch(function(error) {
      console.log('[getDetail error]: ' + JSON.stringify(error));
      callback_(error, null);
    });

}

exports.find = find;
exports.create = create;
exports.update = update;
exports.getDetail = getDetail;
