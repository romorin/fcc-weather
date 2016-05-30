/*********************************************************
	Api section
*********************************************************/

/*
	Set to get from api or test
*/
var getJsonFct = getWeatherJson;

/////////////////////////////////////////////////////////
// constants

var WEATHER_URL_PRE = "http://api.openweathermap.org/data/2.5/weather?appid=499279b9b6f061d2b82497bdd219688e&q=";
var WEATHER_ICON_PRE = "http://openweathermap.org/img/w/";
var WEATHER_ICON_EXT = ".png";

var PRECISION = 2;

var PIC_URL = {
	'CLEAR_MOON' : "https://dl.dropboxusercontent.com/s/0vf7fivvuuwrjck/clear-moon.jpg",
	'CLOUD_MOON' : "https://dl.dropboxusercontent.com/s/e7r0gp9hx45qojh/cloud-moon.jpg",
	'CLEAR_SUN' : "https://dl.dropboxusercontent.com/s/9wfsoa3j2qq3o70/sunset.jpg",
	'CLOUD_SUN' : "https://dl.dropboxusercontent.com/s/d36pxotvc8ehywj/cloudy.jpg",
	'THUNDER' : "https://dl.dropboxusercontent.com/s/zpln1kbgohnc0dk/lightning.jpg",
	'SNOW' : "https://dl.dropboxusercontent.com/s/8knvqpic7q96aca/snowstorm.jpg",
	'MIST' : "https://dl.dropboxusercontent.com/s/iljz3aw25vdh806/trees%20in%20mist.jpg",
	'RAIN' : "https://dl.dropboxusercontent.com/s/klqji3ow64jlyzc/Gotas%20en%20una%20hoja%203.jpg"
};
var images = {};

var LABEL_INPUT = "Go!";
var LABEL_SHOW = "Change!";

/////////////////////////////////////////////////////////
// data for testing purpose

var TEST_GOOD_JSON = {
	"coord":{"lon":-0.13,"lat":51.51},
	"weather":[{"id":802,"main":"Thunderstorm","description":"heavy shower rain and drizzle","icon":"02d"}],
	"base":"stations",
	"main":{"temp":284.56,"pressure":1016,"humidity":82,"temp_min":282.15,"temp_max":286.95},
	"visibility":10000,
	"wind":{"speed":5.1,"deg":80},
	"clouds":{"all":44},
	"dt":1464308108,
	"sys":{"type":1,"id":5091,"message":0.0441,"country":"GB","sunrise":1464321192,"sunset":1464379381},
	"id":2643743,
	"name":"London London London",
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
// temp management

function kelvinToFahrenheit(kelvin) {
	return kelvin * 9/5 - 459.67;
}

function kelvinToCelsius(kelvin) {
	return kelvin - 273.15;
}

function trimPrecision(number) {
	var exp = Math.pow(10, PRECISION);
	return Math.round(number * exp) / exp;
}

var tempValues = {};
function getTempWriter(id) {
	return function (contents) {
		var value = {'k':contents, 'c':trimPrecision(kelvinToCelsius(contents)), 'f':trimPrecision(kelvinToFahrenheit(contents))};
		tempValues[id] = value;

		var degree = jQuery("input:radio[name=degree]:checked").attr('id');
		writeTemp(id, value, degree);
	};
}

function writeTemp(id, value, degree) {
	var temp = [value.k, ' K'].join('');
	if (degree === 'celcius') {
		temp = [value.c, ' °C'].join('');
	} else if (degree === 'farhenheit') {
		temp = [value.f, ' °F'].join('');
	}
	jQuery(id).html(temp);
}

function onDegreeChange() {
	var degree = jQuery("input:radio[name=degree]:checked").attr('id');
	for (var id in tempValues) {
		writeTemp(id, tempValues[id], degree);
	}
}

/////////////////////////////////////////////////////////
// Background + Icon management

function codeToBg(code) {
	switch(code) {
		case '01d':
		case '02d':
			return [images.CLEAR_SUN.src, "clear day"];
		case '01n':
		case '02n':
			return [images.CLEAR_MOON.src, "clear night"];
		case '03d':
		case '04d':
			return [images.CLOUD_SUN.src, "cloudy day"];
		case '03n':
		case '04n':
			return [images.CLOUD_MOON.src, "cloudy night"];
		case '09d':
		case '10d':
		case '09n':
		case '10n':
			return [images.RAIN.src, "rain"];
		case '11d':
		case '11n':
			return [images.THUNDER.src, "thunderstorm"];
		case '13d':
		case '13n':
			return [images.SNOW.src, "snowstorm"];
		case '50d':
		case '50n':
			return [images.MIST.src, "mist"];
	}
}

var ID_ICON = "#weather-icon";
var ID_BACKGROUND = "#background";

function getIconWriter() {
	return function (contents) {
		// update icon
		jQuery(ID_ICON).prop("src", [WEATHER_ICON_PRE, contents, WEATHER_ICON_EXT].join(""));

		// update background
		var bgData = codeToBg(contents);
		var bg = jQuery(ID_BACKGROUND);
		var img = bg.children('img');
		img.attr('src', bgData[0]);
		img.attr('alt', bgData[1]);
	};
}

/////////////////////////////////////////////////////////
// time management

function getDateWriter(id) {
	return function (contents) {
		var date = new Date(contents * 1000);
		jQuery(id).html(date.toTimeString().split(' ', 1));
	};
}

/////////////////////////////////////////////////////////
// main

function getHtmlWriter(id) {
	return function (contents) {
		jQuery(id).html(contents);
	};
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
	'sunrise' : 	{ 'path' : ["sys", "sunrise"],				'writer' : getDateWriter('#sunrise')},
	'sunset' : 		{ 'path' : ["sys", "sunset"],					'writer' : getDateWriter('#sunset')},
	'weatherName' :{ 'path' : ["weather", 0, "main"],			'writer' : getHtmlWriter('#weather-name')},
	'weatherDesc' :{ 'path' : ["weather", 0, "description"],	'writer' : getHtmlWriter('#weather-desc')},
	'weatherIcon' :{ 'path' : ["weather", 0, "icon"],			'writer' : getIconWriter()}
};

/*********************************************************
	Top section
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
		setLocationState(false);
		jQuery("#weather-block").show();
		jQuery("#background").show();
	} else {
		jQuery("#weather-block").hide();
		jQuery("#background").hide();
		jQuery('#status').html(json.message);
		jQuery("#error-block").show();
	}
}

function setLocationState(toInput) {
	var inputElem = jQuery("#input-location");
	var labelElem = jQuery("#label-location");
	var actionButton = jQuery("#go-button");

	if (toInput === true) {
		inputElem.show();
		labelElem.hide();
		actionButton.html(LABEL_INPUT);
	} else {
		inputElem.hide();
		labelElem.show();
		actionButton.html(LABEL_SHOW);
	}
}

// main function to display the weather
function onActionClick() {
	var inputElem = jQuery("#input-location");
	if (inputElem.is(":visible")) {
		var loc = encodeURIComponent(inputElem.val());
		getJsonFct(processWeatherJson, loc);
	} else {
		setLocationState(true);
	}
}

function preload() {
	for (var url in PIC_URL) {
		images[url] = new Image();
		images[url].src = PIC_URL[url];
	}
}

// to be done when the page is ready
jQuery(document).ready(function() {
	jQuery("#go-button").on("click", onActionClick);
	jQuery("input[name=degree]:radio").change(onDegreeChange);
});

/* Preload code */
$(window).load( function(){
	preload();
});
