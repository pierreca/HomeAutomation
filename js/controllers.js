var homeDashboardApp = angular.module('homeDashboardApp', ['amChartsDirective']);

var temperature_streams = [
  'Bedroom_Multisensor_temperature',
  'Front_Door_Multisensor_temperature',
  'Nest_temperature',
  'Rooftop_Multisensor_temperature'
];

var humidity_streams = [
  'Bedroom_Multisensor_humidity',
  'Front_Door_Multisensor_humidity',
  'Nest_humidity',
  'Rooftop_Multisensor_humidity'
];

var illuminance_streams = [
  'Bedroom_Multisensor_illuminance',
  'Front_Door_Multisensor_illuminance',
  'Rooftop_Multisensor_illuminance'
];

homeDashboardApp.factory('XivelyApi', ['$http', '$q', function($http, $q) {
	var url = 'https://api.xively.com/v2/feeds/155745000.json?key=vpk2mUbVq2PoKr7x8qri8mKLvXJ9K0JVKe5mOfNzcRSSfLhd&callback=JSON_CALLBACK'
	var xivelyApi = {};
	xivelyApi.getUrl = function (datastreamNames, duration) {
		if (typeof(datastreamNames) === 'string') {
			// single datastream
			url += '&datastreams=' + datastreamNames; 
		} else if (Object.prototype.toString.call(datastreamNames) === '[object Array]') {
			url += '&datastreams=';
			for (var i = 0; i < datastreamNames.length; i++) {
				url += datastreamNames[i];
				if (i < datastreamNames.length - 1) {
					url += ',';
				}
			}
		}
		
		if (typeof(duration) === 'string') {
			url += '&duration=' + duration;
		}
		
		return url;
	};
	
	xivelyApi.getChartData = function (datastreamNames, duration) {
		var url = this.getUrl(datastreamNames, duration);
		return new $q(function (resolve, reject) {
			$http.jsonp(url).success(function(data) {
				resolve(data);		
			});
		});
	}
	
	return xivelyApi;
}]);


homeDashboardApp.controller('SensorValuesCtrl', ['$scope', '$http', 'XivelyApi', function ($scope, $http, xivelyApi) {
	var buildChartOptions = function(data) {
		return {
			data: data,
			type: "serial",
	
			categoryField: "at",
			legend: {
				enabled: true
			},
			chartScrollbar: {
				enabled: false,
			},
			chartCursor: {
				categoryBalloonDateFormat: "JJ:NN"
			},
			categoryAxis: {
				minPeriod: "mm",
				parseDates: true
			},
			valueAxes: [{
				position: "top",
				title: "°F"
			}],
			graphs: [
				{
					"bullet": "round",
					"id": "bedroomTempGraph",
					"title": "bedroom",
					"valueField": "bedroomTemp"
				},
				{
					"bullet": "round",
					"id": "livingRoomTempGraph",
					"title": "living room",
					"valueField": "livingRoomTemp"
				},
				{
					"bullet": "round",
					"id": "rooftopTempGraph",
					"title": "rooftop",
					"valueField": "rooftopTemp"
				},
				{
					"bullet": "round",
					"id": "frontDoorTempGraph",
					"title": "front door",
					"valueField": "frontDoorTemp"
				}
			]
    	}
	};
	
	$scope.showTempChart = false;
	$scope.getTempChart = function() {
		$scope.showTempChart = !$scope.showTempChart;
		if ($scope.showTempChart) {
			xivelyApi.getChartData(temperature_streams, '6hours').then(function(data) {
				console.log('Reformatting data');
				var chartData = [];
				for (var i = 0; i < data.datastreams[0].datapoints.length; i++) {
					chartData.push({
						at: data.datastreams[0].datapoints[i].at,
						bedroomTemp: data.datastreams[0].datapoints[i].value,
						frontDoorTemp: data.datastreams[1].datapoints[i].value,
						livingRoomTemp: data.datastreams[2].datapoints[i].value,
						rooftopTemp: data.datastreams[3].datapoints[i].value,
					});
				}
				console.log('Setting data for chart');
				console.log(JSON.stringify(chartData));
				$scope.tempChartOptions = buildChartOptions(chartData);
			});
		}
	};
	/*
        data: [{
				"at": "2015-08-28T01:30:02.528397Z",
				"bedroomTemp": "70.8",
				"frontDoorTemp": "76.2",
				"livingRoomTemp": "78.0",
				"rooftopTemp": "84.7"
			},
			{
				"at": "2015-08-28T01:45:02.065181Z",
				"bedroomTemp": "70.5",
				"frontDoorTemp": "75.7",
				"livingRoomTemp": "78.0",
				"rooftopTemp": "84.6"
			}],
        type: "serial",

        categoryField: "at",
        legend: {
            enabled: true
        },
        chartScrollbar: {
            enabled: false,
        },
		chartCursor: {
			categoryBalloonDateFormat: "JJ:NN"
		},
		categoryAxis: {
			minPeriod: "mm",
			parseDates: true
		},
        valueAxes: [{
            position: "top",
            title: "°F"
        }],
        graphs: [{
				"bullet": "round",
				"id": "bedroomTempGraph",
				"title": "bedroom",
				"valueField": "bedroomTemp"
			},
			{
				"bullet": "round",
				"id": "livingRoomTempGraph",
				"title": "living room",
				"valueField": "livingRoomTemp"
			},
			{
				"bullet": "round",
				"id": "rooftopTempGraph",
				"title": "rooftop",
				"valueField": "rooftopTemp"
			},
			{
				"bullet": "round",
				"id": "frontDoorTempGraph",
				"title": "front door",
				"valueField": "frontDoorTemp"
			}]
	*/
	$scope.tempChartOptions = buildChartOptions([]);
	
	var baseUrl = xivelyApi.getUrl();
	console.log('Xively URL: ' + baseUrl);
	$http.jsonp(baseUrl).success(function(data) {
		var temperatures = [];
		var humidities = [];
		var illuminances = [];
		
		for (var i=0; i < data.datastreams.length; i++) {
			var streamName = data.datastreams[i].id;
			var shortName = streamName.split('_')[0];
			var streamValue = data.datastreams[i].current_value;
			var streamDate = data.datastreams[i].at;
			if (streamName.indexOf('temperature') > -1)
			{
				temperatures.push({name: shortName, value: streamValue, timestamp: streamDate});
			} else if (streamName.indexOf('humidity') > -1) {
				humidities.push({name: shortName, value: streamValue, timestamp: streamDate});				
			} else if (streamName.indexOf('illuminance') > -1) {
				illuminances.push({name: shortName, value: streamValue, timestamp: streamDate});				
			}
		}
		
		$scope.temperatures = temperatures;	
		$scope.humidities = humidities;	
		$scope.illuminances = illuminances;	
	});
}]);

homeDashboardApp.directive('sensorState', function(){
	return {
		restrict: 'E',
		scope: {
			sensor: '='	
		},
		templateUrl: '/sensor-state.html'	
	};
});
