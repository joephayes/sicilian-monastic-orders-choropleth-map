/* global config L */

'use strict';

class ChoroplethMapExample {
  constructor() {
    this.map = L.map('map').setView([37.5656, 14.28551], 8);
  }

  initOrdersSelect(orders_data) {
    let orders_select = $('#orders_select');
    let orders = Object.keys(orders_data[Object.keys(orders_data)[0]]);
    $.each(orders, (index, value) => {
      orders_select
        .append($('<option>', { value : value })
          .text(this.snakeCaseToTitleCase(value)));
    });

    orders_select.change(() => {
      this.refreshMap();
    });

    orders_select.val(orders[0]).change();
  }

  run() {
    L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?access_token=' + config.MAPBOX_ACCESS_TOKEN, {
      minZoom: 8,
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>, ' +
      'Imagery © <a href="https://mapbox.com">Mapbox</a>'
    }).addTo(this.map);

    L.Control.InfoControl = L.Control.extend({
      'onAdd': () => {
        return L.DomUtil.create('div', 'info');
      },

      'onRemove': (map) => {
        delete map.infoControl;
      },

      'setContent': (props) => {
        let orders_select = $('#orders_select');
        let order_name = orders_select.val();
        L.control.infoControl.getContainer().innerHTML = '<h4>Monastic Orders</h4><em>Current Order: <strong>' +
          this.snakeCaseToTitleCase(order_name) + '</strong></em><br/>' + (props ?
            '<em>Selected province:</em> <strong>' + props.NOME_PRO +
            '</strong><br/><em>Location Quotient: ' +
            this.orders_data[props.NOME_PRO][order_name] + '</em>'
            : '<br/>Hover over a province');
      }
    });

    L.control.infoControl = new L.Control.InfoControl();
    L.control.infoControl.addTo(this.map);

    $.when(
      $.getJSON('it_sicilia_provinces.geojson', (data) => {
        this.province_data = data;
      }),
      $.getJSON('places-20180727.geojson', (data) => {
        let monasteries = data.features.map((f)=>{
          let properties = f.properties;
          let province = ((province) => {
            if (province.toLowerCase() === 'syracuse') {
              return 'SIRACUSA';
            }
            return province.toUpperCase();
          })(f.properties.province);
          return {
            "monastic_order": properties.order.toUpperCase(),
            "province": province,
            "name": properties.english_place_name
          };
        }
        );
        if (monasteries.length > 0) {
          this.orders_data = this.calculateLQs(monasteries, true);
        }
      })
    ).then(() => {
      this.initOrdersSelect(this.orders_data);
    });

    this.map.attributionControl.addAttribution('Monastic order data &copy; <a href="http://www.thehayesweb.org/dhayes/">Dawn Marie Hayes</a>');

    let legend = L.control({position: 'bottomright'});

    legend.onAdd = () => {
      let div = L.DomUtil.create('div', 'info legend'),
        grades = [0.0, 0.1, 0.5, 1.0, 1.5, 1.75, 2.0, 3.0],
        labels = [],
        from, to;

      for (let i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(
          '<i style="background:' + this.getColor(from) + '"></i> ' +
          from + (to ? '&ndash;' + to : '+'));
      }

      let divHtml = '<div class=\'title\'>Location Quotients</div>' +
        '<div class=\'subtitle\'>(Quotients over 1.5 considered' +
        ' a specialization)</div>' + labels.join('<br/>');

      div.innerHTML = divHtml;
      return div;
    };

    legend.addTo(this.map);
  }

  snakeCaseToTitleCase(s) {
    return s.split('_').map((item) => {
      return item.charAt(0).toUpperCase() + item.substring(1).toLowerCase();
    }).join(' ');
  }

  // get color depending on location quotient value
  getColor(d) {
    return d > 3.0  ? '#800026' :
      d > 2.0  ? '#BD0026' :
      d > 1.75 ? '#E31A1C' :
      d > 1.5  ? '#FC4E2A' :
      d > 1.0  ? '#FD8D3C' :
      d > 0.5  ? '#FEB24C' :
      d > 0.1  ? '#FED976' :
      d > 0.0  ? '#FFEDA0' : '#FFFFCC';
  }

  style(feature) {
    let orders_select = $('#orders_select');
    let lq = this.orders_data &&
      this.orders_data[feature.properties.NOME_PRO] &&
      this.orders_data[feature.properties.NOME_PRO][orders_select.val()] ?
      this.orders_data[feature.properties.NOME_PRO][orders_select.val()] :
      0;
    return {
      weight: 0.8,
      fillOpacity: 0.7,
      fillColor: this.getColor(lq)
    };
  }

  highlightFeature(e) {
    let layer = e.target;

    layer.setStyle({
      weight: 5,
      color: '#665',
      dashArray: '',
      fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }

    L.control.infoControl.setContent(layer.feature.properties);
  }

  resetHighlight(e) {
    this.geojson.resetStyle(e.target);
    L.control.infoControl.setContent();
  }

  zoomToFeature(e) {
    this.map.fitBounds(e.target.getBounds());
  }

  onEachFeature(feature, layer) {
    layer.on({
      mouseover: this.highlightFeature,
      mouseout: this.resetHighlight.bind(this),
      click: this.zoomToFeature
    });
  }

  refreshMap() {
    if (this.geojson) {
      this.map.removeLayer(this.geojson);
    }

    this.geojson = L.geoJson(this.province_data, {
      style: this.style.bind(this),
      onEachFeature: this.onEachFeature.bind(this)
    });
    this.geojson.addTo(this.map);

    L.control.infoControl.setContent();
  }

  // source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round#A_better_solution
  round(number, precision) {
    let shift = (number, precision) => {
      let numArray = ('' + number).split('e');
      return +(numArray[0] + 'e' + (numArray[1] ? (+numArray[1] + precision) : precision));
    };
    return shift(Math.round(shift(number, +precision)), -precision);
  }

  calculateLQs(data, mergeUncertain) {
    // Given an array of objects that contain a "province" key and a
    // "monastic_order" key, this function will use them to calculate
    // location quotients. A location quotient is used to determine the
    // representation of an order within a province.
    // LQ = (regional total of order / grand total of order) / (regional total of all orders / grand total of all orders)

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

    let location_quotients = Object.keys(orders_by_province).reduce((accumulator, current_value) => {
      if (!accumulator.hasOwnProperty(current_value)) {
        accumulator[current_value] = {};
      }

      accumulator[current_value] = Object.keys(orders_by_province[current_value]).reduce((acc, cv) => {
        if (!acc.hasOwnProperty(cv)) {
          acc[cv] = 0;
        }

        acc[cv] = this.round(
          (orders_by_province[current_value][cv] / totals_by_order[cv]) /
          (totals_by_province[current_value] / total_number), 2);

        return acc;
      }, Object.keys(totals_by_order).reduce((a,o)=>{a[o]=0; return a;}, {}));

      return accumulator;
    }, {});

    return location_quotients;
  }
}

(new ChoroplethMapExample()).run();
