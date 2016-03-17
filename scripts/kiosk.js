// kiosk.ejs

//$(function() {
$(document).ready(function() {

  //var access_tokens = [];
  var person_details = [];
  var persons_segments = [];
  var global_map_update = {
    'pp': ''
  };
  //var master_map_obj    = { 'pp' : '' };

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
      //video.src = window.webkitURL.createObjectURL(stream);
      video.src = window.URL.createObjectURL(stream);
      video.play();
    }, errBack);
  } else if (navigator.mozGetUserMedia) { // WebKit-prefixed
    navigator.mozGetUserMedia(videoObj, function(stream) {
      video.src = window.URL.createObjectURL(stream);
      video.play();
    }, errBack);
  }

  // Trigger photo take
  $('#snap').click(function() {

    var $btn = $(this).button('loading');
    var group_id = $('#group_id').text();

    context.drawImage(video, 0, 0, 320, 240);

    var obj_to_send = {
      data_Url: canvas.toDataURL(),
      group_id: group_id
    }

    kiosk_identify(obj_to_send, function(err, result) {

      if (!err && result.length > 0) {
        //access_tokens = JSON.parse(result);
        person_details = JSON.parse(result);
        //alert(result);

        getPersonsSegments(function(err, result) {

          if (err) {
            $btn.button('reset');
            alert(JSON.stringify(err));
          } else {
            //alert(JSON.stringify(result));

            persons_segments = result;
            console.log('[persons_segments]: ' + JSON.stringify(persons_segments));

            // null for pluck_obj means get all points
            //generateMap(persons_segments, null, function(err, data) {
            updateMapPoint(persons_segments, null, function(err, data) {

              $('#map_image').attr('src', 'data:image/jpg;base64,' + data);

              generateTabs(persons_segments);

              $('#div_tabs_controls').css('visibility', 'visible');

              $btn.button('reset');
            });
          }
        });
      } else {
        alert(JSON.stringify(err));
        $btn.button('reset');
        $('#map_image').attr('src', '');
      }

    });
  });

  $(document).on('click', 'a.list-group-item', function(e) {

    //alert($(this).find('.list-group-item-heading').text());
    e.preventDefault();
    //alert('test');
    //alert($(this).find('#coordinates').text());

    $("body").addClass("loading");

    var coordinates = $(this).find('#coordinates').text();

    /*
    if($('sticky').hasClass('active')) {
    	coordinates = global_pushpin_obj + '&pp=' + coordinates + ';97;ABC';
    }
    */

    /*
    var pushpin_obj = {
    	'coordinates' : coordinates
    }
    */

    //global_pushpin_obj = pushpin_obj;

    var pluck_obj = {
      'person_index': $(this).find('#person_index').text(),
      'segment_index': $(this).find('#segment_index').text()
    }

    updateMapPoint(persons_segments, pluck_obj, function(err, data) {

      $('#map_image').attr('src', 'data:image/jpg;base64,' + data);
      $("body").removeClass("loading");
    });

  });

  $('#sticky').on('click', function() {
    if ($(this).hasClass('active')) {
      //alert('was active');
      $(this).html('Sticky mode off');
      $(this).addClass('btn-danger').removeClass('btn-success');
    } else {
      //alert('was disabled');
      $(this).html('Sticky mode on');
      $(this).addClass('btn-success').removeClass('btn-danger');
    }
  });

  $('#reset').on('click', function(e) {

    e.preventDefault();

    $("body").addClass("loading");

    updateMapPoint(persons_segments, null, function(err, data) {

      $('#map_image').attr('src', 'data:image/jpg;base64,' + data);
      $("body").removeClass("loading");
    });

  });


  function generateTabHeader(persons_segments) {

    var html = '';
    var class_active = 'class="active"';

    for (var i = 0, len = persons_segments.length; i < len; i++) {

      var person_segment = persons_segments[i];
      var user_data = JSON.parse(person_segment['userData']);
      var f_name = user_data['f_name'];
      var id = user_data['f_name'] + '_' + user_data['l_name'];

      if (i > 0) class_active = '';

      html += '<li role="presentation" ' + class_active + '><a href="#' + id + '" aria-controls="' + id + '" role="tab" data-toggle="tab"><div id="circle0' + (i + 1) + '" class="circle"></div>' + f_name + '</a></li>';

    }

    return html;

  }

  function generateTabContent(person_segments) {

    var person_index = person_segments['index'];
    var segments = person_segments['Segments'];
    //var class_active   = 'active';
    var content = '<div class="list-group">';

    for (var i = 0, len = segments.length; i < len; i++) {

      var segment = segments[i];
      var start_date_local = segment['StartDateLocal'];
      var segment_type = segment['SegmentType'];
      var address = segment['Location']['address'];
      var coordinates = segment['Location']['coordinates'];
      var glyph_icon = '';

      switch (segment_type) {
        case 'Air':
          glyph_icon = 'glyphicon-plane';
          break;
        case 'Hotel':
          glyph_icon = 'glyphicon-bed';
          break;
        default:
          glyph_icon = 'glyphicon-star';
      }

      //if(i > 0) class_active = '';

      content += '  <a href="#" class="list-group-item">';
      content += '    <div style="float:left; display:table-cell; height:60px">';
      content += '      <span style="vertical-align:middle" class="glyphicon ' + glyph_icon + '" aria-hidden="true"></span>';
      content += '    </div>';
      content += '    <div style="margin-left:20px">';
      content += '      <h5 class="list-group-item-heading">' + address + '</h5>';
      content += '      <p class="list-group-item-text">' + start_date_local + '</p>';
      content += '    </div>';
      content += '    <div hidden id="coordinates">' + coordinates['lat'] + ',' + coordinates['lng'] + '</div>';
      content += '    <div hidden id="person_index">' + person_index + '</div>';
      content += '    <div hidden id="segment_index">' + i + '</div>';
      content += '  </a>';

    }

    content += '</div>'

    return content;

  }

  function generateTabPanel(persons_segments) {

    var html = '';
    var active = 'active';

    for (var i = 0, len = persons_segments.length; i < len; i++) {

      var person_segments = persons_segments[i];

      person_segments['index'] = i;

      var user_data = JSON.parse(person_segments['userData']);
      var f_name = user_data['f_name'];
      var id = user_data['f_name'] + '_' + user_data['l_name'];

      if (i > 0) active = '';

      html += '<div role="tabpanel" class="tab-pane ' + active + '" id="' + id + '">'

      html += generateTabContent(person_segments);

      html += '</div>'
    }

    return html;

  }

  function generateTabs(persons_segments) {

    var html = '';

    html += '<ul class="nav nav-tabs" role="tablist">';
    html += generateTabHeader(persons_segments);
    html += '</ul>';

    html += '<div class="tab-content">';

    html += generateTabPanel(persons_segments);

    html += '</div>'; //tab-content

    $('#div_tabs').html(html);

  }

  /*
  $('#btn_kiosk_identify').click(function() {
  	//alert('Identify clicked');

  	var obj_to_send = {
  		data_Url: canvas.toDataURL(),
  	}

  	kiosk_identify(obj_to_send, function(err, result) {

  		if(!err && result.length > 0) {
  			//access_tokens = JSON.parse(result);
  			person_details = JSON.parse(result);
  			alert(result);
  		}
  		else {
  			alert(err);
  		}

  	});
  });
  */

  function kiosk_identify(obj, callback_) {

    var item_to_send = JSON.stringify(obj);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/identify', true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.send(item_to_send);
    //$("body").addClass("loading");

    xhr.onloadend = function() {
      var response = xhr.responseText;

      //$("body").removeClass("loading");
      console.log('[kiosk_identify]: ' + response);

      var response_obj = JSON.parse(response);

      if (response_obj.hasOwnProperty('result')) {
        callback_(response_obj['result'], null) // this is an error
      } else {
        callback_(null, response);
      }

      //alert(response);
    }
  }

  /*
  $('#btn_get_segments').click(function() {

  	getPersonsSegments(function(err, result) {

  		if(err) {
  			alert(JSON.stringify(err));
  		}
  		else {
  			alert(JSON.stringify(result));
  			generateMap(function(err, data) {

  				$('#map_image').attr('src', 'data:image/jpg;base64,' + data);

  			});
  		}
  	});

  });
  */

  function getPersonsSegments(callback_) {

    //if(access_tokens.length > 0) {
    if (person_details.length > 0) {

      //console.log('[#btn_get_segments access_token]: ' + JSON.stringify(access_tokens));
      console.log('[#btn_get_segments person_details]: ' + JSON.stringify(person_details));

      var send_obj = {
        'person_details': person_details // array of persons
      }

      //$("body").addClass("loading");

      $.post("/getSegments", send_obj)
        .done(function(data) {
          //$("body").removeClass("loading");
          console.log("[getPersonsSegments]: " + JSON.stringify(data));
          callback_(null, data);
        });


    } else {
      //callback(null, 'No access token!');
      //alert('Need to identify users first!');
      callback_(null, 'Need to identify users first!');
    }
  }

  function updateMapPoint(persons_segments, pluck_obj, callback_) {

    var map_update_obj = generateMapParams(persons_segments, pluck_obj);

    //if(!pluck_obj) master_map_obj = map_update_obj;

    if ($('#sticky').hasClass('active')) {

      global_map_update['pp'] += map_update_obj['pp'];
      map_update_obj['pp'] = global_map_update['pp'];
    } else {
      global_map_update['pp'] = map_update_obj['pp'];
    }

    var send_obj = {
      'persons_segments': persons_segments,
      'map_update_obj': map_update_obj
    }

    console.log('[map_update_obj]: ' + JSON.stringify(map_update_obj));

    //$("body").addClass("loading");

    $.post('/generateMap', send_obj, function(data) {

      //$("body").removeClass("loading");
      callback_(null, data);

    });

  }

  function generateMapParams(persons_segments, pluck_obj) {

    var pluck_person, pluck_segment = null;

    if (pluck_obj) {
      pluck_person = pluck_obj['person_index'];
      pluck_segment = pluck_obj['segment_index'];
    }

    //var abc  = ['A','B','C','D','E','F','G','H','I','J'];
    var icon = ['80', '79', '55', '88', '84'];
    var pp = "";
    var coords_array = [];

    // people
    for (var i = 0, len = persons_segments.length; i < len; i++) {

      if (pluck_obj && (pluck_person != i)) continue;
      // person
      var person_segment = persons_segments[i];
      var segments = person_segment['Segments'];

      // person's segments
      for (var j = 0, lenj = segments.length; j < lenj; j++) {

        if (pluck_obj && (pluck_segment != j)) continue;

        var segment = segments[j];
        var coordinates = segment['Location']['coordinates'];
        var num = j + 1;
        if (num < 10) num = '0' + num;
        else num = num + '';

        pp += '&pp=' + coordinates['lat'] + ',' + coordinates['lng'] + ';' + icon[i] + ';' + num;

        coords_array.push([coordinates['lat'], coordinates['lng']])
      }

    }

    var map_update_obj = {
      'center_coord': 0, // getLatLngCenter(coords_array),
      'zoom': 0, // 10,
      'pp': pp
    }

    return map_update_obj;
  }

  /*
  function generateMap(persons_segments, callback_) {

  	var map_update_obj = generateMapParams(persons_segments);

  	var send_obj = {
  		'persons_segments' : persons_segments,
  		'map_update_obj'   : map_update_obj
  	}

  	console.log('[map_update_obj]: ' + JSON.stringify(map_update_obj));

  	//$("body").addClass("loading");

  	$.post('/generateMap', send_obj, function(data) {

  		//$("body").removeClass("loading");
  		callback_(null, data);

  	});
  }
  */

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



});
