/*********************************************************
	Api section
*********************************************************/

/*
	Set to get from api or test
*/
var getJsonFct = getTestWeatherJson;

/////////////////////////////////////////////////////////
// constants

var WEATHER_URL_PRE = "http://api.openweathermap.org/data/2.5/weather?appid=499279b9b6f061d2b82497bdd219688e&q=";
var WEATHER_ICON_PRE = "http://openweathermap.org/img/w/";
var WEATHER_ICON_EXT = ".png";

var PRECISION = 2;

/////////////////////////////////////////////////////////
// data for testing purpose

var TEST_GOOD_JSON = {
	"coord":{"lon":-0.13,"lat":51.51},
	"weather":[{"id":802,"main":"Clouds","description":"scattered clouds","icon":"03n"}],
	"base":"stations",
	"main":{"temp":284.56,"pressure":1016,"humidity":82,"temp_min":282.15,"temp_max":286.95},
	"visibility":10000,
	"wind":{"speed":5.1,"deg":80},
	"clouds":{"all":44},
	"dt":1464308108,
	"sys":{"type":1,"id":5091,"message":0.0441,"country":"GB","sunrise":1464321192,"sunset":1464379381},
	"id":2643743,
	"name":"London",
	"cod":200
};
var TEST_BAD_JSON = {
	"cod":"404",
	"message":"Error: Not found city"
};
var TEST_JSON = TEST_GOOD_JSON;

/////////////////////////////////////////////////////////
// json getters

// get number data for testing without hitting the api
function getTestWeatherJson(parser, loc) {
   parser(TEST_JSON);
}

// get data from the api
function getWeatherJson(parser, loc) {
	var url = [WEATHER_URL_PRE, loc].join("");
   return jQuery.getJSON(url, parser);
}

/*********************************************************
	Weather dom section
*********************************************************/

/////////////////////////////////////////////////////////
// temp conversion functions

function kelvinToFahrenheit(kelvin) {
	return kelvin * 9/5 - 459.67;
}

function kelvinToCelsius(kelvin) {
	return kelvin - 273.15;
}

function trimPrecision(number) {
	var exp = Math.pow(10, PRECISION);
	jQuery('#test').html(exp);
	return Math.round(number * exp) / exp;
}

/////////////////////////////////////////////////////////
// html writers

function getHtmlWriter(id) {
	var id = id;
	return function (contents) {
		jQuery(id).html(contents);
	}
}

function getTempWriter(id) {
	var id = id;
	return function (contents) {
		var degree = jQuery("input:radio[name=degree]:checked").val();
		var temp = contents;
		if (degree === 'c') {
			temp = trimPrecision(kelvinToCelsius(contents));
		} else if (degree === 'f') {
			temp = trimPrecision(kelvinToFahrenheit(contents));
		}
		jQuery(id).html(temp);
	}
}

function getIconWriter(id, pre, ext) {
	var id = id;
	var pre = pre;
	var ext = ext;
	return function (contents) {
		jQuery(id).prop("src", [pre, contents, ext].join(""));
	}
}

var WEATHER_ELEMS = {
	'temperature': { 'path' : ["main", "temp"], 					'writer' : getTempWriter('#temperature')},
	'humidity' : 	{ 'path' : ["main", "humidity"], 			'writer' : getHtmlWriter('#humidity')},
	'minimum' : 	{ 'path' : ["main", "temp_min"],				'writer' : getTempWriter('#minimum')},
	'maximum' : 	{ 'path' : ["main", "temp_max"],				'writer' : getTempWriter('#maximum')},
	'windSpeed' : 	{ 'path' : ["wind", "speed"],					'writer' : getHtmlWriter('#wind-speed')},
	'windDeg' : 	{ 'path' : ["wind", "deg"],					'writer' : getHtmlWriter('#wind-deg')},
	'coverage' : 	{ 'path' : ["clouds", "all"],					'writer' : getHtmlWriter('#coverage')},
	'city' : 		{ 'path' : ["name"],								'writer' : getHtmlWriter('#city')},
	'country' : 	{ 'path' : ["sys", "country"],				'writer' : getHtmlWriter('#country')},
	'sunrise' : 	{ 'path' : ["sys", "sunrise"],				'writer' : getHtmlWriter('#sunrise')},
	'sunset' : 		{ 'path' : ["sys", "sunset"],					'writer' : getHtmlWriter('#sunset')},
	'weatherName' :{ 'path' : ["weather", 0, "main"],			'writer' : getHtmlWriter('#weather-name')},
	'weatherDesc' :{ 'path' : ["weather", 0, "description"],	'writer' : getHtmlWriter('#weather-desc')},
	'weatherIcon' :{ 'path' : ["weather", 0, "icon"],			'writer' : getIconWriter('#weather-icon', WEATHER_ICON_PRE, WEATHER_ICON_EXT)}
};

/*********************************************************
	Page section
*********************************************************/

function getNestedProp(json, path, depth) {
	// end check
	if(depth >= path.length) {
		return json;

	// error check
	} else if (Number.isInteger(path[depth])) {
		if (!Array.isArray(json) || json.length <= path[depth]) {
			return "";
		}
	} else {
		if (!json.hasOwnProperty(path[depth])) {
			return "";
		}
	}

	// dig deeper
	return getNestedProp(json[path[depth]], path, depth+1);
}

function writeWeather(json) {
	for (var elem in WEATHER_ELEMS) {
		var value = getNestedProp(json, WEATHER_ELEMS[elem].path, 0);
		WEATHER_ELEMS[elem].writer(value);
	}
}

function processWeatherJson(json) {
	if (json.cod === 200) {
		jQuery("#error-block").hide();
		writeWeather(json);
		jQuery("#weather-block").show();
	} else {
		jQuery("#weather-block").hide();
		jQuery('#status').html(json.message);
		jQuery("#error-block").show();
	}
}

// main function to display the weather
function updateWeather() {
	var loc = encodeURIComponent(jQuery("#input-location").val());
	getJsonFct(processWeatherJson, loc);
}

// to be done when the page is ready
jQuery(document).ready(function() {
	jQuery("#go-button").on("click", updateWeather);
	jQuery("input[name=degree]:radio").change(onDegreeChange);
});
