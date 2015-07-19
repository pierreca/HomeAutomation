      
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
      
      var xi_durations_intervals = {
        '12hours' : 30,
        '24hours': 60,
        '5days' : 300
      };
      
      function drawCharts() {
        var durationSelect = document.getElementById('durations');
        var duration = durationSelect.options[durationSelect.selectedIndex].value;
        
        drawAggregatedSensorsChart(temp_humidity_sensors, 'temperature', '#TemperatureChart', duration);
        drawAggregatedSensorsChart(temp_humidity_sensors, 'humidity', '#HumidityChart', duration);
        drawAggregatedSensorsChart(illuminance_sensors, 'illuminance', '#IlluminanceChart', duration);
      }
      
      function buildXivelyUrl(dataStreamNames, duration) {
        var datastreamParameter = "";
        for (index = 0; index < dataStreamNames.length; index++) {
          datastreamParameter += dataStreamNames[index];
          if (index < dataStreamNames.length - 1) {
            datastreamParameter += ",";
          }
        }
        
        var xi_url = 'https://api.xively.com/v2/feeds/155745000.json?key=vpk2mUbVq2PoKr7x8qri8mKLvXJ9K0JVKe5mOfNzcRSSfLhd&datastreams=' + datastreamParameter + '&duration=' + duration + '&interval=' + xi_durations_intervals[duration] + '&limit=1000'
        console.log(xi_url);
        return xi_url;  
      }
      
      function drawAggregatedSensorsChart(sensors, measureName, divId, duration) {
        var datastreams = [];
        for (i = 0; i < sensors.length; i++) {
          datastreams.push(sensors[i] + '_' + measureName);
        }
        console.log(datastreams);
        
        var xi_url = buildXivelyUrl(datastreams, duration);
        var jsonData = $.ajax({
          url: xi_url
        }).done(function (results) {
          var dataTemp = new google.visualization.DataTable();

          dataTemp.addColumn('datetime', 'Time');
          for (i = 0; i < sensors.length; i++) {
            dataTemp.addColumn('number', sensors[i]);
          }

          $.each(results.datastreams[0].datapoints, function (i, row) {
            try {
              var cols = [(new Date(row.at))];
              for (j = 0; j < sensors.length; j++) {
                cols.push(parseFloat(results.datastreams[j].datapoints[i].value));
              }
              dataTemp.addRow(cols);
            }
            catch (err) {
              console.log(err);
            }
          });

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
        });
      }
      
      // load chart lib
      google.load('visualization', '1.1', {
        packages: ['line']
      });

      // call drawChart once google charts is loaded
      google.setOnLoadCallback(drawCharts);
