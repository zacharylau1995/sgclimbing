// Shoe shop data
var shops = [];
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
  // Only get file contents once request is successful
  if (xhttp.readyState ==4 && xhttp.status == 200) {
    // Read data into list of dicts, with each dict representing 1 gym
    // e.g. {
    //               name: 'AllSports Equipment',
    //               address: '52 Ubi Ave 3, #04-44 Frontier, Singapore 408867',
    //               website: 'http://www.allsports-equipment.com/',
    //               shoes: 'Unparallel',
    //               harness: 'Petzl',
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
      shops.push(row_dict);
    }
  };
};

// Note that HTTP request is called synchronously (3rd arg is false) since we need to get the data first before plotting the markers on the map.
xhttp.open("GET", "sg_climbing_shop_data.txt", false);
xhttp.send();
console.log(JSON.stringify(shops, null, 4));




var default_select_menu = ['Choose a brand'];

// Function to create selection menu for each item type, e.g. Shoes, Harness, etc.
function item_select(item_type) {
    // Brand Selection
    var brands_set = new Set();

    // Get all brands from all shops and get unique set of brands
    for (let shop of shops) {
        if (shop[item_type] !== 'null') {
            arr = shop[item_type].split(',').map(item => item.trim());
            arr.forEach((brand) => brands_set.add(brand));
            // console.log(Array.from(brands_set).sort());
        }
    }
    var brands = default_select_menu.concat(Array.from(brands_set).sort());
    console.log(brands);

    var select = document.getElementById(item_type + '-select');

    for (var selection of brands) {
        let option = document.createElement("option");
        option.value = selection;
        option.text = selection;
        select.appendChild(option);
    }

    // Update list of shoe shops based on selection
    select.addEventListener("change", function() {
        let select_description = document.getElementById(item_type + '-select-description');
        let s_selection = select.options[select.selectedIndex].value;

        // Clear current shop descriptions
        select_description.innerHTML = '';

        // Show new shop descriptions based on brand chosen
        shops.forEach(shop => {
            let shop_item_brands = shop[item_type].split(',').map(item => item.trim());
            if (shop_item_brands.includes(s_selection)) {
                select_description.innerHTML += '<p class="mt-4">' + '<h5>' + shop.name + '</h5>' + shop.address.replaceAll(",", "<br>") + '<br>' + '<a href="' + shop.website + '" class="btn btn-primary mt-2" target="_blank">Website</a>' + '</p>';
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    item_select('shoes');
    item_select('harness');
});