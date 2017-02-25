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

var PRECISION = 2;

var PIC_URL = {
	'CLEAR_MOON' : "http://romorin.com/fcc-weather/img/clear-moon.jpg",
	'CLOUD_MOON' : "http://romorin.com/fcc-weather/img/cloud-moon.jpg",
	'CLEAR_SUN' : "http://romorin.com/fcc-weather/img/sunset.jpg",
	'CLOUD_SUN' : "http://romorin.com/fcc-weather/img/cloudy.jpg",
	'THUNDER' : "http://romorin.com/fcc-weather/img/lightning.jpg",
	'SNOW' : "http://romorin.com/fcc-weather/img/snowstorm.jpg",
	'MIST' : "http://romorin.com/fcc-weather/img/trees%20in%20mist.jpg",
	'RAIN' : "http://romorin.com/fcc-weather/img/Gotas%20en%20una%20hoja%203.jpg"
};
var images = {};

var LABEL_INPUT = "Go!";
var LABEL_SHOW = "Change!";

/*********************************************************
	Json
*********************************************************/

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

// safely get a nested json property and return "" on errors
function getNestedProp(json, path) {
	return _getNestedPropImpl(json, path, 0);
}

// path can be array index or object key, since arrays are objects
function _getNestedPropImpl(json, path, depth) {
	// end check
	if(depth >= path.length) {
		return json;
	}
	// error check
	if (!json.hasOwnProperty(path[depth])) {
		return "";
	}
	// dig deeper
	return _getNestedPropImpl(json[path[depth]], path, depth+1);
}

/////////////////////////////////////////////////////////
// base elem

function WeatherElem() {
}

// overidden by the child when he must do something  on json update
WeatherElem.prototype.onJsonUpdate = function () {
};

// overidden by the child when he must do something  on degree change
WeatherElem.prototype.onDegreeChange = function () {
};

/////////////////////////////////////////////////////////
// html elem

var HtmlWeatherElem = (function () {
	// ctr
	function HtmlWeatherElem(id, path) {
		WeatherElem.call(this);

		this._id = id;
		this._path = path;
	}

	HtmlWeatherElem.prototype = Object.create(WeatherElem.prototype);
	HtmlWeatherElem.prototype.constructor = HtmlWeatherElem;

	// write the elem into the html
	HtmlWeatherElem.prototype.onJsonUpdate = function (json) {
		jQuery(this._id).html(getNestedProp(json, this._path));
	};

	return HtmlWeatherElem;
})();

/////////////////////////////////////////////////////////
// date elem

var DateWeatherElem = (function () {
	// ctr
	function DateWeatherElem(id, path) {
		WeatherElem.call(this);

		this._id = id;
		this._path = path;
	}

	DateWeatherElem.prototype = Object.create(WeatherElem.prototype);
	DateWeatherElem.prototype.constructor = DateWeatherElem;

	// write a prettied up version of the date into the html
	DateWeatherElem.prototype.onJsonUpdate = function (json) {
		var date = new Date(getNestedProp(json, this._path) * 1000);
		jQuery(this._id).html(date.toTimeString().split(' ', 1));
	};

	return DateWeatherElem;
})();

/////////////////////////////////////////////////////////
// temp elem

var TempWeatherElem = (function () {

	// leave only # digits after the dot
	function trimPrecision(number) {
		var exp = Math.pow(10, PRECISION);
		return Math.round(number * exp) / exp;
	}

	// get F with the standard precision from kelvin
	function getFahrenheit(kelvin) {
		return trimPrecision(kelvin * 9/5 - 459.67);
	}

	// get C with the standard precision from kelvin
	function getCelsius(kelvin) {
		return trimPrecision(kelvin - 273.15);
	}

	// write a prettied up version of the temperature
	function writeTemp(id, value, degree) {
		var temp = [value.k, ' K'].join('');
		if (degree === 'celcius') {
			temp = [value.c, ' °C'].join('');
		} else if (degree === 'farhenheit') {
			temp = [value.f, ' °F'].join('');
		}
		jQuery(id).html(temp);
	}

	// ctr
	function TempWeatherElem(id, path) {
		WeatherElem.call(this);

		this._id = id;
		this._path = path;
	}

	TempWeatherElem.prototype = Object.create(WeatherElem.prototype);
	TempWeatherElem.prototype.constructor = TempWeatherElem;

	// handle degree change and json update the same by writing the temp into the id element html
	TempWeatherElem.prototype.onDegreeChange =
	TempWeatherElem.prototype.onJsonUpdate = function (json) {
		var contents = getNestedProp(json, this._path);
		var value = {'k':contents, 'c':getCelsius(contents), 'f':getFahrenheit(contents)};

		var degree = jQuery("input:radio[name=degree]:checked").attr('id');
		writeTemp(this._id, value, degree);
	};

	return TempWeatherElem;
})();

/////////////////////////////////////////////////////////
// img elem

var ImgWeatherElem = (function() {

	// ctr
	function ImgWeatherElem(id, path, pre, post) {
		WeatherElem.call(this);

		this._id = id;
		this._path = path;
		this._pre = pre;
		this._post = post;
	}

	ImgWeatherElem.prototype = Object.create(WeatherElem.prototype);
	ImgWeatherElem.prototype.constructor = ImgWeatherElem;

	// handle json update by updating the src
	ImgWeatherElem.prototype.onJsonUpdate = function (json) {
		var contents = getNestedProp(json, this._path);
		jQuery(this._id).prop("src", [this._pre, contents, this._post].join(""));
	};

	return ImgWeatherElem;
})();

/////////////////////////////////////////////////////////
// background elem

var BackgroundWeatherElem = (function() {

	// choose the image to display from the icon code
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

	// ctr
	function BackgroundWeatherElem(id, path) {
		WeatherElem.call(this);

		this._id = id;
		this._path = path;
	}

	BackgroundWeatherElem.prototype = Object.create(WeatherElem.prototype);
	BackgroundWeatherElem.prototype.constructor = BackgroundWeatherElem;

	// handle json update by changing the background
	BackgroundWeatherElem.prototype.onJsonUpdate = function (json) {
		var icon = getNestedProp(json, this._path);

		var bgArray = codeToBg(icon);
		var img = jQuery(this._id).children('img');

		img.attr('src', bgArray[0]);
		img.attr('alt', bgArray[1]);
	};

	return BackgroundWeatherElem;
})();

/////////////////////////////////////////////////////////
// weather json handler

var WeatherJsonHandler = (function() {

	// init the displayed elements in the page into the elems array
	function initElems(self) {
		self._elems.push(new TempWeatherElem('#temperature', ["main", "temp"]));
		self._elems.push(new HtmlWeatherElem('#humidity', ["main", "humidity"]));
		self._elems.push(new TempWeatherElem('#minimum', ["main", "temp_min"]));
		self._elems.push(new TempWeatherElem('#maximum', ["main", "temp_max"]));
		self._elems.push(new HtmlWeatherElem('#wind-speed', ["wind", "speed"]));
		self._elems.push(new HtmlWeatherElem('#wind-deg', ["wind", "deg"]));
		self._elems.push(new HtmlWeatherElem('#coverage', ["clouds", "all"]));
		self._elems.push(new HtmlWeatherElem('#city', ["name"]));
		self._elems.push(new HtmlWeatherElem('#country', ["sys", "country"]));
		self._elems.push(new DateWeatherElem('#sunrise', ["sys", "sunrise"]));
		self._elems.push(new DateWeatherElem('#sunset', ["sys", "sunset"]));
		self._elems.push(new HtmlWeatherElem('#weather-name', ["weather", 0, "main"]));
		self._elems.push(new HtmlWeatherElem('#weather-desc', ["weather", 0, "description"]));
		self._elems.push(new ImgWeatherElem("#weather-icon", ["weather", 0, "icon"],
														"http://openweathermap.org/img/w/", ".png"));
		self._elems.push(new BackgroundWeatherElem("#background", ["weather", 0, "icon"]));
	}

	// ctr
	function WeatherJsonHandler() {
		this._elems = [];
		this._json = {};

		initElems(this);
	}

	// relay json updates to the elems
	WeatherJsonHandler.prototype.onJsonUpdate = function (json) {
		this._json = json;

		var length = this._elems.length;
		for (var i = 0; i < length; i++) {
			this._elems[i].onJsonUpdate(this._json);
		}
	};

	// relay degree change to the elems
	WeatherJsonHandler.prototype.onDegreeChange = function () {
		var length = this._elems.length;
		for (var i = 0; i < length; i++) {
			this._elems[i].onDegreeChange(this._json);
		}
	};
	return WeatherJsonHandler;
})();

/*********************************************************
	Page handler
*********************************************************/

var WeatherPageHandler = (function () {

	// handle the json returned by the api
	function processWeatherJson(self, json) {
		if (json.cod === 200) {
			jQuery("#error-block").hide();
			self._jsonHandler.onJsonUpdate(json);
			jQuery("#weather-block").show();
			jQuery("#background").show();

			jQuery("#input-location").hide();
			jQuery("#label-location").show();
			jQuery("#go-button").html(LABEL_SHOW);
		} else {
			jQuery("#weather-block").hide();
			jQuery("#background").hide();
			jQuery('#status').html(json.message);
			jQuery("#error-block").show();
		}
	}

	// wrap this and give the method pointer to handle the json
	function getParserPtr(self) {
		return function (json) {
			processWeatherJson(self, json);
		};
	}

	// ctr
	function WeatherPageHandler() {
		this._jsonHandler = new WeatherJsonHandler();
	}

	// handle action event
	WeatherPageHandler.prototype.onActionClick = function() {
		var inputElem = jQuery("#input-location");
		if (inputElem.is(":visible")) {
			var loc = encodeURIComponent(inputElem.val());
			getJsonFct(getParserPtr(this), loc);
		} else {
			jQuery("#input-location").show();
			jQuery("#label-location").hide();
			jQuery("#go-button").html(LABEL_INPUT);
		}
	};

	// handle degree change
	WeatherPageHandler.prototype.onDegreeChange = function() {
		this._jsonHandler.onDegreeChange();
	};

	return WeatherPageHandler;
})();

var PAGE_HANDLER = new WeatherPageHandler();

// to be done when the page is ready
jQuery(document).ready(function() {
	// handle go click
	jQuery("#go-button").on("click", PAGE_HANDLER.onActionClick.bind(PAGE_HANDLER));

	// handle input enter press
	jQuery('#input-location').keydown(function(event) {
	  if(event.keyCode == '13') {
	    PAGE_HANDLER.onActionClick();
	  }
	});

	// handle degree change
	jQuery("input[name=degree]:radio").change(PAGE_HANDLER.onDegreeChange.bind(PAGE_HANDLER));
});

// preload images while the user select its location
function preload() {
	for (var url in PIC_URL) {
		images[url] = new Image();
		images[url].src = PIC_URL[url];
	}
}

/* Preload code */
jQuery(window).load( function(){
	preload();
});
