var order_name = '';

function initOrdersSelect() {
  var orders_select = $('#orders_select');
  var orders = Object.keys(orders_data[Object.keys(orders_data)[0]]);
  $.each(orders, function(index, value) {
    orders_select
      .append($('<option>', { value : value })
        .text(snakeCaseToTitleCase(value)));
  });

  orders_select.change(function() {
    order_name = orders_select.val();
    refreshMap();
  });

  orders_select.val(orders[0]).change();
}

var map = L.map('map').setView([37.5656, 14.28551], 8);

L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?access_token=' + config.MAPBOX_ACCESS_TOKEN, {
  minZoom: 8,
  maxZoom: 18,
  attribution: 'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, ' +
  '<a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>, ' +
  'Imagery © <a href="https://mapbox.com">Mapbox</a>'
}).addTo(map);

var info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info');
  this.update();
  return this._div;
};

info.update = function (props) {
  this._div.innerHTML = '<h4>Monastic Orders</h4><em>Current Order: <strong>' +
    snakeCaseToTitleCase(order_name) + '</strong></em><br/>' + (props ?
      '<em>Selected province:</em> <strong>' + props.NOME_PRO +
      '</strong><br/><em>Location Quotient: ' +
      orders_data[props.NOME_PRO][order_name] + '</em>'
      : '<br/>Hover over a province');
};

info.addTo(map);

function snakeCaseToTitleCase(s) {
  return s.split('_').map(function (item) {
    return item.charAt(0).toUpperCase() + item.substring(1).toLowerCase();
  }).join(' ');
}

// get color depending on location quotient value
function getColor(d) {
  return d > 3.0  ? '#800026' :
    d > 2.0  ? '#BD0026' :
    d > 1.75 ? '#E31A1C' :
    d > 1.5  ? '#FC4E2A' :
    d > 1.0  ? '#FD8D3C' :
    d > 0.5  ? '#FEB24C' :
    d > 0.1  ? '#FED976' :
    d > 0.0  ? '#FFEDA0' : '#FFFFCC';
}

function style(feature) {
  return {
    weight: 0.8,
    fillOpacity: 0.7,
    fillColor: getColor(orders_data[feature.properties.NOME_PRO][order_name])
  };
}

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 5,
    color: '#665',
    dashArray: '',
    fillOpacity: 0.7
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }

  info.update(layer.feature.properties);
}

var geojson;

function resetHighlight(e) {
  geojson.resetStyle(e.target);
  info.update();
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature
  });
}

var orders_data, it_provinces_data;

function refreshMap() {
  if (geojson) {
    map.removeLayer(geojson);
  }
  if (orders_data && it_provinces_data) {
    geojson = L.geoJson(it_provinces_data, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(map);
    info.update();
  }
}

// source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round#A_better_solution
function round(number, precision) {
  var shift = function (number, precision) {
    var numArray = ("" + number).split("e");
    return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
  };
  return shift(Math.round(shift(number, +precision)), -precision);
}

function calculateLQs(data, mergeUncertain) {
  // Given an array of objects that contain a "province" key and a
  // "monastic_order" key, this function will use them to calculate
  // location quotients. A location quotient is used to determine the
  // representation of an order within a province.
  // LQ = (regional total of order / grand total of order) / (regional total of all orders / grand total of all orders)

  // let mergeUncertain = true;

  // get order counts by region
  let orders_by_province = data.reduce((accumulator, current_value) => {
    if (current_value.province && current_value.province.length > 0) {
      let p = mergeUncertain ? current_value.province.replace('?', '') : current_value.province;
      if (!accumulator.hasOwnProperty(p)) {
          accumulator[p] = {};
      }
      if (accumulator[p]){
        if (current_value.monastic_order && current_value.monastic_order.length > 0) {
          let m = mergeUncertain ? current_value.monastic_order.replace('?', '') : current_value.monastic_order;
          if (accumulator[p].hasOwnProperty(m)){
            accumulator[p][m] += 1;
          } else {
            accumulator[p][m] = 1;
          }
        }
      }
      return accumulator;
    }
  }, {});

  let totals_by_province = data.reduce((accumulator, current_value) => {
    if (current_value.province && current_value.province.length > 0) {
      let p = mergeUncertain ? current_value.province.replace('?', '') : current_value.province;
      if (!accumulator.hasOwnProperty(p)) {
        accumulator[p] = 0;
      }

      if (current_value.monastic_order && current_value.monastic_order.length > 0) {
       accumulator[p] += 1;
      }

      return accumulator;
    }
  }, {});

  let totals_by_order = data.reduce((accumulator, current_value) => {
    if (current_value.monastic_order && current_value.monastic_order.length > 0) {
      let m = mergeUncertain ? current_value.monastic_order.replace('?', '') : current_value.monastic_order;
      if (!accumulator.hasOwnProperty(m)) {
        accumulator[m] = 0;
      }

      accumulator[m] += 1;
    }

    return accumulator;
  }, {});

  let total_number = Object.keys(totals_by_province).reduce((a, i) => {
   return a += totals_by_province[i];
  }, 0);

  location_quotients = Object.keys(orders_by_province).reduce((accumulator, current_value) => {
    if (!accumulator.hasOwnProperty(current_value)) {
      accumulator[current_value] = {};
    }

    accumulator[current_value] = Object.keys(orders_by_province[current_value]).reduce((acc, cv) => {
      if (!acc.hasOwnProperty(cv)) {
        acc[cv] = 0;
      }

      acc[cv] = round(
        (orders_by_province[current_value][cv] / totals_by_order[cv]) /
        (totals_by_province[current_value] / total_number), 2);

      return acc;
    }, {});

    return accumulator;
  }, {});

  // return [
  //   orders_by_province,
  //   totals_by_order,
  //   totals_by_province,
  //   total_number,
  //   location_quotients
  // ];
  return location_quotients;
}

$.when(
  $.getJSON("it_sicilia_provinces.geojson", function(data) {
    it_provinces_data = data;
  }),
  $.getJSON("monasteries.json", function(data) {
    orders_data = calculateLQs(data, true);
  })
).then(function() {
  initOrdersSelect();
  refreshMap();
});

map.attributionControl.addAttribution('Monastic order data &copy; <a href="http://www.thehayesweb.org/dhayes/">Dawn Marie Hayes</a>');

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend'),
    grades = [0.0, 0.1, 0.5, 1.0, 1.5, 1.75, 2.0, 3.0],
    labels = [],
    from, to;

  for (var i = 0; i < grades.length; i++) {
    from = grades[i];
    to = grades[i + 1];

    labels.push(
      '<i style="background:' + getColor(from) + '"></i> ' +
      from + (to ? '&ndash;' + to : '+'));
  }

  var divHtml = '<div class=\'title\'>Location Quotients</div>' +
    '<div class=\'subtitle\'>(Quotients over 1.5 considered' +
    ' a specialization)</div>' + labels.join('<br/>');

  div.innerHTML = divHtml;
  return div;
};

legend.addTo(map);

