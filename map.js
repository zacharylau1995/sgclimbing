// GET GYM DATA
// Read gym data from tab delimited text file
var gyms = [];
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  // Only get file contents once request is successful
  if (xhttp.readyState ==4 && xhttp.status == 200) {
    // Read data into list of dicts, with each dict representing 1 gym
    // e.g. {
    //               name: 'Fit Bloc (Kent Ridge)',
    //               coord: [1.287811988848755, 103.79049099997037],
    //               boulder: true,
    //               toprope: false,
    //               lead: false,
    //               autobelay: true, ...
    //             }
    var lines = xhttp.responseText.trim().split('\r\n');
    // console.log(lines);

    let data_header = lines[0].split('\t');

    for (let i = 1; i < lines.length; i++) {
      let row = lines[i].split('\t');
      let row_dict = {};
      for (let j = 0; j < row.length; j++) {
        row_dict[data_header[j]] = row[j];
      }
      // console.log(JSON.stringify(row_dict, null, 4));
      gyms.push(row_dict);
    }
  };
};

// Note that HTTP request is called synchronously (3rd arg is false) since we need to get the data first before plotting the markers on the map.
xhttp.open("GET", "sg_climbing_gym_data.txt", false);
xhttp.send();
console.log(JSON.stringify(gyms, null, 4));
// console.log(gyms[0]['lon']);
// console.log(parseFloat(gyms[0]['lon']));
// console.log(gyms.filter(x => x['autobelay'] === true && x['boulder'] === true).length);


// Get postal code and region
// Source for region mapping from blockgames.sg: https://www.instagram.com/p/CY0z4sZPkh2/
region = {
  central: ['01','02','03','04','05','06','07','08','09','10','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'],
  north: ['56','57','65','66','67','68','72','73','75','76','77','78','79','80'],
  west: ['11','12','13','58','59','60','61','62','64','64','69','70','71'],
  east: ['34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','54','55','81','82','50','51','52','53']
  };

gyms.forEach((gym) => {
  // Read postal code from address using regex
  let raw_postcode = gym['address'].match(/Singapore \d{6}/)[0];
  gym['postcode'] = raw_postcode.split(' ')[1];

  // Get region of SG from postal code and create boolean values for each region type (see console log)
  let district_code = gym['postcode'].substring(0,2);
  for (let reg in region) {
    if (region[reg].includes(district_code)) {
      gym[reg] = 'true';
    }
    else {
      gym[reg] = 'false';
    }
  }
});
console.log(JSON.stringify(gyms, null, 4));




// CREATE MAP
// Function to create markers
function create_marker(gym) {
  gym['marker'] = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([parseFloat(gym['lon']), parseFloat(gym['lat'])])),
    name: gym['name'],
    description: gym['address'] + '<br>',
    website: gym['website']
  });
};
gyms.forEach(create_marker);
var gym_marker_list = gyms.map((gym) => gym.marker);
// console.log(JSON.stringify(gyms, null, 4));
// console.log(JSON.stringify(gyms.map((gym) => gym.marker), null, 4));
console.log(JSON.stringify(gym_marker_list[0].getProperties(), null, 4));


// Styles for markers
var iconStyle = new ol.style.Style({
  image: new ol.style.Icon({
    anchor: [0.5, 1],
    anchorXUnits: 'fraction',
    anchorYUnits: 'fraction',
    // src: 'https://icon-library.com/images/google-maps-gps-icon/google-maps-gps-icon-14.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Google_Maps_pin.svg/1200px-Google_Maps_pin.svg.png',
    scale: 0.02
  })

});

var labelStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '12px Calibri,sans-serif',
    overflow: true,
    fill: new ol.style.Fill({
      color: '#fff'
    }),
    stroke: new ol.style.Stroke({
      color: '#000',
      width: 3
    }),
    offsetY: -12
  })
});
var style = [iconStyle, labelStyle];

// Create map object
var map = new ol.Map({
    target: 'map',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      })
      // new ol.layer.MapboxVector.MapboxVector ({
      //   styleUrl: 'https://api.maptiler.com/maps/streets/style.json?key=VBMMYm5ggFMKIEvairbO'
      // })
      // ,
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([103.82, 1.36]),
      zoom: 11.5
    })
  });


// var base = new ol.layer.Tile({
//   source: new ol.source.OSM()
// })
// map.addLayer(base);

// Style map using MapTiler API (need to include olms module!)
// var styleJson = 'https://api.maptiler.com/maps/streets/style.json?key=VBMMYm5ggFMKIEvairbO';
// olms.apply(map, styleJson);

// Create markers for all gyms
var markers = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: gym_marker_list
  }),
  style: function(feature) {
    labelStyle.getText().setText(feature.get('name'));
    return style;
  },
  // Bring marker to front
  zIndex: 1001
});
map.addLayer(markers);

// Add popup on hover for markers
var tooltipContainer = document.getElementById('tooltip');
var tooltipTitle = document.getElementById('tooltip-title');
var tooltipBody = document.getElementById('tooltip-body');
var gymWebsiteOut = document.getElementById('gym-website-out');
var tooltip = new ol.Overlay({
  element: tooltipContainer,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});
map.addOverlay(tooltip);

var featureName = '';
map.on('click', function(evt){
  var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, markers) {
    featureName = feature.get('name');
    featureDescription = feature.get('description').replace(/,/g, '<br>');
    featureWebsite = feature.get('website');
    // console.log(featureDescription);
    var coordinates = feature.getGeometry().getCoordinates();
    tooltipTitle.innerHTML = featureName;
    tooltipBody.innerHTML = featureDescription;
    gymWebsiteOut.href = featureWebsite;
    tooltip.setPosition(coordinates);

    return feature;
  });
  console.log(feature);
  if (!feature && (featureName != '')) {
    featureName = '';
    featureDescription = '';
    feature_website = '#';
    tooltip.setPosition(undefined);
  }
});




// CREATE FILTERS
var filter_button_states = {toprope: false,
  boulder: false,
  lead: false,
  autobelay: false,
  moonboard: false,
  kilter: false,
  tension: false,
  central: false,
  north: false,
  west: false,
  east: false};
// const key = Object.keys(filter_button_states).filter(key => filter_button_states[key] === true);
// console.log(JSON.stringify(key, null, 4))

// Function to reset gym counter to full count
function reset_gym_counter() {
  document.getElementById('gymcounter').innerHTML = gyms.length;
  document.getElementById('gymcounter-on').innerHTML = gyms.length;
}

// Filter markers based on filters selected by user
document.addEventListener('DOMContentLoaded', function() {
  reset_gym_counter();
  for (let filter_name in filter_button_states) {
    // let filter_name = 'toprope';
    let btn = document.getElementById(filter_name);
    // let p1 = gym_marker_list[0]

    btn.addEventListener('click', function() {
      // Track button state (checked vs not checked)
      if (filter_button_states[filter_name] == false) {
        filter_button_states[filter_name] = true;
      }
      else {
        filter_button_states[filter_name] = false;
      }
      console.log(filter_button_states[filter_name]);

      // Loop through each filter state
      const key = Object.keys(filter_button_states).filter(key => filter_button_states[key] === true);
      let gym_counter = 0;
      for (var gym of gyms) {
        var counter = 0;
        for (const filter of key) {
          if (gym[filter] == 'true') {
            counter += 1;
          }
        }
        if (counter === key.length) {
          gym['marker'].setStyle(null);
          gym_counter += 1;
        }
        else {
          gym['marker'].setStyle(new ol.style.Style({}));
        }
      };
      // console.log(gym_counter);

      // Update gym counter for each filter selection
      document.getElementById('gymcounter').innerHTML = gym_counter;
      document.getElementById('gymcounter-on').innerHTML = gym_counter;
      // console.log(JSON.stringify(filter_button_states, null, 4))
    })
  };

  // Clear button
  let clrbtn = document.getElementById('clearall');
  clrbtn.addEventListener('click', function() {
    // Make it so that button will have permanent change in fill colour
    clrbtn.classList.remove('active');

    // Reset gym counter to count all
    reset_gym_counter();

    // Make gym markers visibe
    for (var gym of gyms) {
      gym['marker'].setStyle(null);
    }

    // Toggle all filter buttons
    for (var filter_name in filter_button_states) {
      if (filter_button_states[filter_name] === true) {
        document.getElementById(filter_name).classList.remove('active');
        filter_button_states[filter_name] = false;
      }
    }
  });

  // Reset view so that map is centered at SG again
  let reset_btn = document.getElementById('reset-view');
  reset_btn.addEventListener('click', function() {
    map.setView(
      new ol.View({
        center: ol.proj.fromLonLat([103.82, 1.36]),
        zoom: 11.5
      })
    );
  });
});




// if (p1.getStyle() == null) {
//   p1.setStyle(new ol.style.Style({}));
// }
// else {
//   p1.setStyle(null);
// }