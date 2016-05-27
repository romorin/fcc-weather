var getJsonFct = getWeatherJson; // getTestNumberJson or getNumberJson
		
var WEATHER_URL_PRE = "http://api.openweathermap.org/data/2.5/weather?appid=499279b9b6f061d2b82497bdd219688e&q=";

var WEATHER_ICON_PRE = "http://openweathermap.org/img/w/"
var WEATHER_ICON_EXT = ".png"

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
var TEST_ERROR_JSON = {
	"cod":"404",
	"message":"Error: Not found city"
};

var TEST_JSON = TEST_ERROR_JSON;

// get number data for testing without hitting the api
function getTestWeatherJson(funct, loc) {
   checkLoadWeather(TEST_JSON);
}

// get data from the api
function getWeatherJson(loc) {
	var url = [WEATHER_URL_PRE, loc].join("");
   jQuery.getJSON(url, checkLoadWeather);
}

// load data into html if ok
function checkLoadWeather(json) {
	if (json.cod === 200) {
		loadWeather(json);
	} else {
		onErrorWeather(json);
	}
}

// display error on weather fetch
function onErrorWeather(json) {
	jQuery('#temperature').html("");
	jQuery('#humidity').html("");
	jQuery('#minimum').html("");
	jQuery('#maximum').html("");
	jQuery('#wind-speed').html("");
	jQuery('#wind-deg').html("");
	jQuery('#coverage').html("");
	jQuery('#city').html("");
	jQuery('#country').html("");
	jQuery('#sunrise').html("");
	jQuery('#sunset').html("");
	jQuery('#weather-name').html("");
	jQuery('#weather-desc').html("");
	jQuery('#weather-icon').prop("src", "#");
	jQuery('#status').html(json.message);
}

// load good data into html
function loadWeather(json) {
	jQuery('#temperature').html(json.main.temp);
	jQuery('#humidity').html(json.main.humidity);
	jQuery('#minimum').html(json.main.temp_min);
	jQuery('#maximum').html(json.main.temp_max);
	jQuery('#wind-speed').html(json.wind.speed);
	jQuery('#wind-deg').html(json.wind.deg);
	jQuery('#coverage').html(json.clouds.all);
	jQuery('#city').html(json.name);
	jQuery('#country').html(json.sys.country);
	jQuery('#sunrise').html(json.sys.sunrise);
	jQuery('#sunset').html(json.sys.sunset);
	jQuery('#weather-name').html(json.weather[0].main);
	jQuery('#weather-desc').html(json.weather[0].description);
	jQuery('#weather-icon').prop("src", [WEATHER_ICON_PRE, json.weather[0].icon, WEATHER_ICON_EXT].join(""));
	jQuery('#status').html("OK");
}

// main function to display the weather
function getWeather() {
	var loc = encodeURIComponent(jQuery("#input-location").val());
	getJsonFct(loc);
}

// to be done when the page is ready
jQuery(document).ready(function() {
	jQuery("#go-button").on("click", getWeather);
});
