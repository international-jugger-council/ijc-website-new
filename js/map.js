// spreadsheet location from url
var SPREADSHEET_KEY = '1KHNrKrpunvWNaGVStFhj7Ra2EC_kgK8sZQsxa2yiJuk';
// API key from the developer console
var API_KEY = 'AIzaSyAtjfgtWoGNkp5Uc2XQ7kh3Po3wfXY-R4U';
// this is an extremely aggressive range. :D
var RANGE = 'A1:ZZ10000'
var spreadsheet_url =  `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_KEY}/values/${RANGE}?key=${API_KEY}`
var spreadsheet_data = [];
var num_markers = 0;

/**
 * Get all the data from the spreadsheet!
 * https://docs.google.com/spreadsheets/d/1KHNrKrpunvWNaGVStFhj7Ra2EC_kgK8sZQsxa2yiJuk/edit#gid=0
 * We are looking for a few columns (case-sensitive):
 * Name
 * Latitude
 * Longitude
 * ... whatever else we want to display (nothing for now) ...
 */
function listCentres() {
  fetch(spreadsheet_url).then(function(response) {
      return response.json();
    }).then(function(result) {
      spreadsheet_data = result.values;
      initMap();
    });
}

function getQueryVariable(variable, default_return='') {
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) == variable) {
          return decodeURIComponent(pair[1]);
      }
  }
  return default_return;
}

function initMap() {
  startLat = parseFloat(getQueryVariable('lat')) || 43.6754782;
  startLng = parseFloat(getQueryVariable('lng')) || -79.3481673;
  startZoom = parseFloat(getQueryVariable('zoom')) || 2;

  num_markers = 0;

  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: startZoom,
    center: {lat: startLat, lng: startLng}
  });

  // Add ze markers to ze map.
  var name_col = spreadsheet_data[0].indexOf('Name');
  var city_col = spreadsheet_data[0].indexOf('City');
  var country_col = spreadsheet_data[0].indexOf('Country');
  var lat_col = spreadsheet_data[0].indexOf('Latitude');
  var lon_col = spreadsheet_data[0].indexOf('Longitude');
  var url_col = spreadsheet_data[0].indexOf('Website');
  var contact_person_col = spreadsheet_data[0].indexOf('Contact Person');
  var contact_method_col = spreadsheet_data[0].indexOf('Contact Method');
  var active_col = spreadsheet_data[0].indexOf('Active?');
  var armored_col = spreadsheet_data[0].indexOf('Armored?');
  var youth_col = spreadsheet_data[0].indexOf('Youth?');
  var description_col = spreadsheet_data[0].indexOf('Description');
  var logo_col = spreadsheet_data[0].indexOf('Logo');
  var markers = spreadsheet_data.slice(1).map(function(club_data, i) {
    // images for things that are or are not to be shown
    var IMAGE_ROOT = '../../img/map'

    var image = IMAGE_ROOT + '/IJC_map_pin.png';

    if (club_data[armored_col] == 'TRUE') {
      if (! showArmored) {
        return;
      }
      image = IMAGE_ROOT + '/IJC_map_pin_armored.png'
    }

    if (club_data[active_col] != 'TRUE') {
      if (! showInactive) {
        return;
      }
      image = IMAGE_ROOT + '/IJC_map_pin_inactive.png'
    }

    if (club_data[youth_col] == 'TRUE') {
      if (! showYouth) {
        return;
      }
      image = IMAGE_ROOT + '/IJC_map_pin_youth.png'
    }

    if (club_data[youth_col] == 'FALSE' && club_data[active_col] == 'TRUE' && club_data[armored_col] == 'FALSE') {
      if (! showNormal) {
        return;
      }
      image = IMAGE_ROOT + '/IJC_map_pin.png';
    }

    // otherwise, make a marker for it
    var info_window_string = `<div id="content">`;
    if (club_data[logo_col]) {
      // if we have a logo to show, jam everything into a table and put the logo on one side of it.
      info_window_string += `<table><tr><td style="padding-right:15px;background-image:url(${club_data[logo_col]});background-repeat:no-repeat;width:150px;height:150px;background-size:contain;background-position:center;"></td><td>`
    }
    info_window_string += `
      <h1 id="firstHeading" class="firstHeading">
        ${club_data[name_col]} : ${club_data[city_col]}, ${club_data[country_col]}
      </h1>
      <div id="bodyContent">`
    if (club_data[url_col] != '') {
      info_window_string += `<p>
            <a href="${club_data[url_col]}">Website</a>
          </p>`;
    }
    if (club_data[armored_col] == 'TRUE') {
      info_window_string += '<p>Armored Jugger club</p>'
    }
    if (club_data[contact_person_col] != '' || club_data[contact_method_col] != '') {
      info_window_string += `<p>
            Contact ${club_data[contact_person_col]}`
      if(club_data[contact_method_col] != '') {
        info_window_string += ` via ${club_data[contact_method_col]}
          </p>`
      }
    } else if (club_data[active_col] != 'TRUE') {
      info_window_string += '<p>Inactive</p>'
    } else {
      info_window_string += `<p>
            Contact info unknown
            </p>`
    }
    info_window_string += `<p>
        ${club_data[description_col]}
        </p>
      </div>`
    if (club_data[logo_col]) {
      // if we're showing a logo, we need to close off our tables all tidy-like.
      info_window_string += `</td></tr></table>`
    }
    info_window_string += `</div>`;

    var infowindow = new google.maps.InfoWindow({
      content: info_window_string
    });

    var marker = new google.maps.Marker({
      position: {lat: parseFloat(club_data[lat_col]), lng: parseFloat(club_data[lon_col])},
      title: club_data[name_col],
      animation: google.maps.Animation.DROP,
      icon: image
    });
    marker.addListener('click', function() {
      infowindow.open(map, marker);
    });
    num_markers = num_markers + 1;

    return marker;
  });

  document.getElementById("numMarkers").innerHTML = num_markers;

  // strip out null markers before sending it on to avoid pissing off the clusterer
  markers = markers.filter(function(marker) {
    return marker != undefined;
  });

  // Add a marker clusterer to manage the markers.
  var markerCluster = new MarkerClusterer(map, markers,
      {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

  describe_map(map, markers, markerCluster);
}

var showInactive = getQueryVariable('showInactive');
var showArmored = getQueryVariable('showArmored');
var showYouth = getQueryVariable('showYouth');
var showNormal = getQueryVariable('showNormal', default_return=true);

function setShowInactive() {
  showInactive = document.getElementById("showInactive").checked;
  initMap();
}
function setShowArmored() {
  showArmored = document.getElementById("showArmored").checked;
  initMap();
}
function setShowYouth() {
  showYouth = document.getElementById("showYouth").checked;
  initMap();
}
function setShowNormal() {
  showNormal = document.getElementById("showNormal").checked;
  initMap();
}

function describe_map(map, markers, markerCluster) {
  var description_spot = document.getElementById("description");
  description_spot.innerText = ""
}