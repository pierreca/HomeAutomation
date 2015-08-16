var xi_feed_id = '155745000';
var xi_api_key = 'vpk2mUbVq2PoKr7x8qri8mKLvXJ9K0JVKe5mOfNzcRSSfLhd';

var temp_humidity_sensors = [
  'Bedroom_Multisensor',
  'Front_Door_Multisensor',
  'Nest',
  'Rooftop_Multisensor'
];

var illuminance_sensors = [
  'Bedroom_Multisensor',
  'Front_Door_Multisensor',
  'Rooftop_Multisensor'
];

var xi_duration_intervalCount = {
  '12hours' : 2,
  '24hours': 4,
  '5days' : 20
};

function drawCharts() {
  var durationSelect = document.getElementById('durations');
  var duration = durationSelect.options[durationSelect.selectedIndex].value;
  
  drawAggregatedSensorsChart(temp_humidity_sensors, 'temperature', '#TemperatureChart', duration);
  drawAggregatedSensorsChart(temp_humidity_sensors, 'humidity', '#HumidityChart', duration);
  drawAggregatedSensorsChart(illuminance_sensors, 'illuminance', '#IlluminanceChart', duration);
}

function buildXivelyUrls(dataStreamNames, duration) {
  var datastreamParameter = "";
  var urls = [];
  for (index = 0; index < dataStreamNames.length; index++) {
    datastreamParameter += dataStreamNames[index];
    if (index < dataStreamNames.length - 1) {
      datastreamParameter += ",";
    }
  }
  
  var now = moment();
  var endDate = now.toISOString();
  
  for (i = 1; i <= xi_duration_intervalCount[duration]; i++) {
    var startDate = now.subtract(6, 'hours').toISOString();
  
    var xi_url = 'https://api.xively.com/v2/feeds/' + xi_feed_id + '.json?key=' + xi_api_key + '&datastreams=' + datastreamParameter + '&start=' + startDate + '&end=' + endDate + '&limit=1000&find_previous'
    urls.push(xi_url);
    console.log("URL: " + xi_url);
    endDate = startDate;
  }
  
  return urls;  
}

function drawAggregatedSensorsChart(sensors, measureName, divId, duration) {
  var datastreams = [];
  for (i = 0; i < sensors.length; i++) {
    datastreams.push(sensors[i] + '_' + measureName);
  }
  console.log(datastreams);
  
  var xi_urls = buildXivelyUrls(datastreams, duration);
  
  var dataSubsets = [];
  
  function downloadPage(pageIndex) {
    var jsonData = $.ajax({
      url: xi_urls[pageIndex]
    }).done(function (results) {
      var subset = [];
      $.each(results.datastreams[0].datapoints, function (i, row) {
        try {
          var cols = [(new Date(row.at))];
          for (j = 0; j < sensors.length; j++) {
            cols.push(parseFloat(results.datastreams[j].datapoints[i].value));
          }
          subset.push(cols);
        }
        catch (err) {
          console.log(err);
        }
      });
      dataSubsets.push(subset);
      pageIndex++;
      if (pageIndex < xi_urls.length) {
        downloadPage(pageIndex);
      } else {
        var dataTemp = new google.visualization.DataTable();
        
        dataTemp.addColumn('datetime', 'Time');
        for (i = 0; i < sensors.length; i++) {
          dataTemp.addColumn('number', sensors[i]);
        }
        
        for (i = 0; i < dataSubsets.length; i++) {
          for (j = 0; j < dataSubsets[i].length; j++) {
            dataTemp.addRow(dataSubsets[i][j]);
          }
        }
        
        var chart = new google.charts.Line($(divId).get(0));
        var options = {
            title: measureName,
            width: 1200,
            height: 400,
            series: {
                0: {targetAxisIndex: 0}
            }
          };

        chart.draw(dataTemp, google.charts.Line.convertOptions(options));
      }
    });
  }
  
  downloadPage(0);
}

// load chart lib
google.load('visualization', '1.1', {
  packages: ['line']
});

// call drawChart once google charts is loaded
google.setOnLoadCallback(drawCharts);
