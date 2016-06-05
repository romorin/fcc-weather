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


function getNestedProp(json, path) {
	return getNestedPropImpl(json, path, 0);
}

// path can be array index or object key, since arrays are objects
function getNestedPropImpl(json, path, depth) {
	// end check
	if (path === undefined) {
		return "";
	}

	if(depth >= path.length) {
		return json;
	}
	// error check
	if (!json.hasOwnProperty(path[depth])) {
		return "";
	}
	// dig deeper
	return getNestedPropImpl(json[path[depth]], path, depth+1);
}

/////////////////////////////////////////////////////////
// base elem

function WeatherElem() {
}

WeatherElem.prototype.onJsonUpdate = function () {
};

WeatherElem.prototype.onDegreeChange = function () {
};

/////////////////////////////////////////////////////////
// html elem

var HtmlWeatherElem = (function () {
	function HtmlWeatherElem(id, path) {
		WeatherElem.call(this);

		this._id = id;
		this._path = path;
	}

	HtmlWeatherElem.prototype = Object.create(WeatherElem.prototype);
	HtmlWeatherElem.prototype.constructor = HtmlWeatherElem;

	HtmlWeatherElem.prototype.onJsonUpdate = function (json) {
		jQuery(this._id).html(getNestedProp(json, this._path));
	};

	return HtmlWeatherElem;
})();

/////////////////////////////////////////////////////////
// date elem

var DateWeatherElem = (function () {
	function DateWeatherElem(id, path) {
		WeatherElem.call(this);

		this._id = id;
		this._path = path;
	}

	DateWeatherElem.prototype = Object.create(WeatherElem.prototype);
	DateWeatherElem.prototype.constructor = DateWeatherElem;

	DateWeatherElem.prototype.onJsonUpdate = function (json) {
		var date = new Date(getNestedProp(json, this._path) * 1000);
		jQuery(this._id).html(date.toTimeString().split(' ', 1));
	};

	return DateWeatherElem;
})();

/////////////////////////////////////////////////////////
// temp elem

var TempWeatherElem = (function () {
	function trimPrecision(number) {
		var exp = Math.pow(10, PRECISION);
		return Math.round(number * exp) / exp;
	}

	function getFahrenheit(kelvin) {
		return trimPrecision(kelvin * 9/5 - 459.67);
	}

	function getCelsius(kelvin) {
		return trimPrecision(kelvin - 273.15);
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

	function TempWeatherElem(id, path) {
		WeatherElem.call(this);

		this._id = id;
		this._path = path;
	}

	TempWeatherElem.prototype = Object.create(WeatherElem.prototype);
	TempWeatherElem.prototype.constructor = TempWeatherElem;

	TempWeatherElem.prototype.onDegreeChange =
	TempWeatherElem.prototype.onJsonUpdate = function (json) {
		var contents = getNestedProp(json, this._path);
		var value = {'k':contents, 'c':getCelsius(contents), 'f':getFahrenheit(contents)};
		//tempValues[this._id] = value;

		var degree = jQuery("input:radio[name=degree]:checked").attr('id');
		writeTemp(this._id, value, degree);
	};

	return TempWeatherElem;
})();

/////////////////////////////////////////////////////////
// img elem

var ImgWeatherElem = (function() {
	function ImgWeatherElem(id, path, pre, post) {
		WeatherElem.call(this);

		this._id = id;
		this._path = path;
		this._pre = pre;
		this._post = post;
	}

	ImgWeatherElem.prototype = Object.create(WeatherElem.prototype);
	ImgWeatherElem.prototype.constructor = ImgWeatherElem;

	ImgWeatherElem.prototype.onJsonUpdate = function (json) {
		var contents = getNestedProp(json, this._path);
		jQuery(this._id).prop("src", [this._pre, contents, this._post].join(""));
	};

	return ImgWeatherElem;
})();

/////////////////////////////////////////////////////////
// background elem

var BackgroundWeatherElem = (function() {
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

	function BackgroundWeatherElem(id, path) {
		WeatherElem.call(this);

		this._id = id;
		this._path = path;
	}

	BackgroundWeatherElem.prototype = Object.create(WeatherElem.prototype);
	BackgroundWeatherElem.prototype.constructor = BackgroundWeatherElem;

	BackgroundWeatherElem.prototype.onJsonUpdate = function (json) {
		var icon = getNestedProp(json, this._path);

		// update background
		var bgArray = codeToBg(icon);
		var bg = jQuery(this._id);
		var img = bg.children('img');
		img.attr('src', bgArray[0]);
		img.attr('alt', bgArray[1]);
	};

	return BackgroundWeatherElem;
})();

/////////////////////////////////////////////////////////
// weather json handler

var WeatherJsonHandler = (function() {
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
	
	function WeatherJsonHandler() {
		this._elems = [];
		this._json = {};
		
		initElems(this);
	}

	WeatherJsonHandler.prototype.onJsonUpdate = function (json) {
		this._json = json;
		
		var length = this._elems.length;
		for (var i = 0; i < length; i++) {
			this._elems[i].onJsonUpdate(this._json);
		}
	};
	
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
	
	function getParserPtr(self) {
		return function (json) {
			processWeatherJson(self, json);
		};
	}
	
	function WeatherPageHandler() {
		this._jsonHandler = new WeatherJsonHandler();
	}

	// main function to display the weather
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
	
	WeatherPageHandler.prototype.onDegreeChange = function() {
		this._jsonHandler.onDegreeChange();
	};

	return WeatherPageHandler;
})();

var PAGE_HANDLER = new WeatherPageHandler();

// to be done when the page is ready
jQuery(document).ready(function() {
	jQuery("#go-button").on("click", PAGE_HANDLER.onActionClick.bind(PAGE_HANDLER));
	jQuery("input[name=degree]:radio").change(PAGE_HANDLER.onDegreeChange.bind(PAGE_HANDLER));
});

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
