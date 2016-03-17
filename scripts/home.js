var access_token = null;
var group_id = null;
var person_id = null;
var persisted_face_ids = [];

// Put event listeners into place
//window.addEventListener("DOMContentLoaded", function() {
$(function() {

  // Grab elements, create settings, etc.
  var canvas = document.getElementById("canvas"),
    context = canvas.getContext("2d"),
    video = document.getElementById("video"),

    videoObj = {
      "video": true
    },
    errBack = function(error) {
      console.log("Video capture error: ", error.code);
    };

  // Put video listeners into place
  if (navigator.getUserMedia) { // Standard
    navigator.getUserMedia(videoObj, function(stream) {
      video.src = stream;
      video.play();
    }, errBack);
  } else if (navigator.webkitGetUserMedia) { // WebKit-prefixed
    navigator.webkitGetUserMedia(videoObj, function(stream) {
      video.src = window.webkitURL.createObjectURL(stream);
      video.play();
    }, errBack);
  } else if (navigator.mozGetUserMedia) { // WebKit-prefixed
    navigator.mozGetUserMedia(videoObj, function(stream) {
      video.src = window.URL.createObjectURL(stream);
      video.play();
    }, errBack);
  }

  // Trigger photo take
  //document.getElementById("snap").addEventListener("click", function() {
  $('#snap').click(function() {
    context.drawImage(video, 0, 0, 320, 240);
  });

  // Trigger delete faces
  document.getElementById("delete").addEventListener("click", function() {

    if (persisted_face_ids.length == 0) {
      alert('No face records to delete.');
      return;
    }

    var delete_obj = {
      'group_id': group_id,
      'person_id': person_id,
      'persisted_face_ids': persisted_face_ids
    }

    deleteAllFaceRecords(delete_obj, function(err, data) {

      if (err) {
        console.log('[deleteAllFaceRecords error]: ' + JSON.stringify(err));
        alert('Error deleting faces: ' + JSON.stringify(err));
      } else {
        console.log('[deleteAllFaceRecords result]: ' + JSON.stringify(data));
        alert('Delete face result: ' + JSON.stringify(data));
      }

    });

  });
}, false);

function deleteAllFaceRecords(obj, callback_) {

  var item_to_delete = JSON.stringify(obj);

  var xhr = new XMLHttpRequest();
  xhr.open("POST", '/deleteAllFaces', true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

  xhr.send(item_to_delete);
  $("body").addClass("loading");

  xhr.onloadend = function() {
    var response = xhr.responseText;

    $("body").removeClass("loading");
    callback_(null, response);

    //alert(response);
  }
}

function uploadFaceToOxford(obj, callback_) {
  //alert(JSON.stringify(obj));
  var item_to_send = JSON.stringify(obj);

  var xhr = new XMLHttpRequest();
  xhr.open("POST", '/uploadFace', true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

  xhr.send(item_to_send);
  $("body").addClass("loading");

  xhr.onloadend = function() {
    var response = xhr.responseText;

    //alert(response);
    $("body").removeClass("loading");
    callback_(null, response);
  }
}

function findGroup(name_to_find, callback) {

  var xhr = new XMLHttpRequest();
  xhr.open("GET", '/findGroup?&domain=' + name_to_find, true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

  xhr.send();
  $("body").addClass("loading");

  xhr.onloadend = function() {
    var response = xhr.responseText;

    $("body").removeClass("loading");
    callback(null, response);

    //alert(response);

  }
}

function createGroup(name, callback) {

  var item_to_send = JSON.stringify({
    'name': name
  });

  var xhr = new XMLHttpRequest();
  xhr.open("POST", '/createGroup', true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

  xhr.send(item_to_send);
  $("body").addClass("loading");

  xhr.onloadend = function() {
    var response = xhr.responseText;


    callback(null, response);
    //alert(response);
    $("body").removeClass("loading");

  }
}

// creates group if needed, and callbacks group_id
function settleGroup(login_id, callback_) {

  var domain = login_id.split('@').pop();

  findGroup(domain, function(err, data) {

    console.log('Find group response: ' + data);

    var group, group_id;

    if (!data) {

      // create group
      createGroup(domain, function(err, data) {

        console.log('Create group response: ' + data);

        if (!err) {
          group_id = data;
          callback_(null, group_id);
        }
        //alert(group_id);
      });

    } else if (data && JSON.parse(data).hasOwnProperty('personGroupId')) {

      group = JSON.parse(data);
      group_id = group['personGroupId'];
      console.log('Group id from ownProperty: ' + group_id);
      callback_(null, group_id);
    } else {
      // error no group id returned
      console.log('findGroup: No group returned');
      callback_({
        'error': 'findGroup no group returned'
      }, null);
    }
  });
}

function updatePerson(update_obj, callback) {

  var item_to_send = JSON.stringify(update_obj);

  var xhr = new XMLHttpRequest();
  xhr.open("POST", '/personUpdate', true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

  xhr.send(item_to_send);
  $("body").addClass("loading");

  xhr.onloadend = function() {
    var response = xhr.responseText;

    $("body").removeClass("loading");

    callback(null, response);
    //alert(response);
  }
}

function settlePerson(settle_obj, callback_) {

  var group_id = settle_obj['group_id'];
  //var person_id    = settle_obj['person_id'];
  var name_id = settle_obj['name_id'];
  var access_token = settle_obj['access_token'];
  var f_name = settle_obj['f_name'];
  var l_name = settle_obj['l_name'];

  findPersonFromGroup(group_id, name_id, function(err, data) {

    if (err) callback_(err, null);

    console.log('[findPersonFromGroup]: ' + data);
    var person = JSON.parse(data);

    if (!(person.result) && !(person.personId)) {

      console.log('No person found. Will attempt create...' + JSON.stringify(settle_obj));

      createPerson(settle_obj, function(err, data) {
        if (err) {
          console('[createPerson error] ' + JSON.stringify(err));
          callback_(err, null);
        } else {
          console.log('[createPerson]: ' + JSON.stringify(data));
          callback_(null, data);
        }
      });
    } else {
      // Update person details - access token

      var person_response = data;

      console.log('[updatePerson person_responsej]: ' + JSON.stringify(person_response));

      var update_obj = {
        'group_id': group_id,
        'person_id': person_response.personId,
        //'person_id'   : person_id,
        'person_name': person_response.name,
        'access_token': access_token,
        'f_name': f_name,
        'l_name': l_name
      }

      console.log('[updatePerson update_obj]: ' + JSON.stringify(update_obj));

      updatePerson(update_obj, function(err, data) {
        if (!err) {
          console.log('updatePerson successful: ' + person_response);
          callback_(null, person_response);
        } else {
          callback_(err, null);
        }
      });

      //callback_(null, data); // Person found
    }

  });
}

function findPersonFromGroup(group_id, name_to_find, callback) {

  var xhr = new XMLHttpRequest();
  xhr.open("GET", '/findPerson?&name_id=' + name_to_find + '&group_id=' + group_id, true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

  xhr.send();
  $("body").addClass("loading");

  xhr.onloadend = function() {
    var response = xhr.responseText;

    $("body").removeClass("loading");
    console.log('findPersonFromGroup response: ' + response);
    callback(null, response);

    //alert(response);
  }
}

function createPerson(create_obj, callback) {

  var item_to_send = JSON.stringify(create_obj);

  console.log('createPerson: ' + item_to_send);

  var xhr = new XMLHttpRequest();
  xhr.open("POST", '/createPerson', true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

  xhr.send(item_to_send);
  $("body").addClass("loading");

  xhr.onloadend = function() {
    var response = xhr.responseText;

    $("body").removeClass("loading");

    alert('Created new user: ' + response);

    callback(null, response);
    //alert(response);
  }
}
