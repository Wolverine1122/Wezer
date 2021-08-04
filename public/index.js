/*-----------------------------------------------*/
/* GOOGLE MAP */
/*-----------------------------------------------*/

var map;
var geoJSON;
var request;
var gettingData = false;

//Please make sure to replace this key with another API key that you can get for free at https://openweathermap.org/
var openWeatherMapKey = "40eac2c4a9ad8a312a59e46f4867c804";


/* SETTING LONGITUDE AND LATITUDE */
function setLat() {
  var latCity = document.getElementById("latitude").innerHTML;

  if (latCity === "") {
    latCity = 40;
  } else {
    var latCity = Number(document.getElementById("latitude").innerHTML);
  }
  return latCity;
}
function setLong() {
  var longCity = document.getElementById("longitude").innerHTML;

  if (longCity === "") {
    longCity = -74;
  } else {
    var longCity = Number(document.getElementById("longitude").innerHTML);
  }
  return longCity;
}

function initialize() {
  var mapOptions = {
    zoom: 8,
    center: new google.maps.LatLng(setLat(), setLong()),
  };

  map = new google.maps.Map(
    document.getElementById("map-canvas"),
    mapOptions
  );
  // Add interaction listeners to make weather requests
  google.maps.event.addListener(map, "idle", checkIfDataRequested);

  // Sets up and populates the info window with details
  map.data.addListener("click", function (event) {
    infowindow.setContent(
      "<img src=" +
      event.feature.getProperty("icon") +
      ">" +
      "<br /><strong>" +
      event.feature.getProperty("city") +
      "</strong>" +
      "<br />" +
      event.feature.getProperty("temperature") +
      "&deg;C" +
      "<br />" +
      event.feature.getProperty("weather")
    );
    infowindow.setOptions({
      position: {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      },
      pixelOffset: {
        width: 0,
        height: -15,
      },
    });
    infowindow.open(map);
  });
}

var checkIfDataRequested = function () {
  // Stop extra requests being sent
  while (gettingData === true) {
    request.abort();
    gettingData = false;
  }
  getCoords();
};

// Get the coordinates from the Map bounds
var getCoords = function () {
  var bounds = map.getBounds();
  var NE = bounds.getNorthEast();
  var SW = bounds.getSouthWest();
  getWeather(NE.lat(), NE.lng(), SW.lat(), SW.lng());
};

// Make the weather request
var getWeather = function (northLat, eastLng, southLat, westLng) {
  gettingData = true;
  var requestString =
    "//api.openweathermap.org/data/2.5/box/city?bbox=" +
    westLng +
    "," +
    northLat +
    "," + //left top
    eastLng +
    "," +
    southLat +
    "," + //right bottom
    map.getZoom() +
    "&cluster=yes&format=json" +
    "&APPID=" +
    openWeatherMapKey;
  request = new XMLHttpRequest();
  request.onload = proccessResults;
  request.open("get", requestString, true);
  request.send();
};

// Take the JSON results and proccess them
var proccessResults = function () {
  console.log(this);
  var results = JSON.parse(this.responseText);
  if (typeof results.list.length !== 'undefined') {
    if (results.list.length > 0) {
      resetData();
      for (var i = 0; i < results.list.length; i++) {
        geoJSON.features.push(jsonToGeoJson(results.list[i]));
      }
      drawIcons(geoJSON);
    }
  }
};

var infowindow = new google.maps.InfoWindow();

// For each result that comes back, convert the data to geoJSON
var jsonToGeoJson = function (weatherItem) {
  var feature = {
    type: "Feature",
    properties: {
      city: weatherItem.name,
      weather: weatherItem.weather[0].main,
      temperature: weatherItem.main.temp,
      min: weatherItem.main.temp_min,
      max: weatherItem.main.temp_max,
      humidity: weatherItem.main.humidity,
      pressure: weatherItem.main.pressure,
      windSpeed: weatherItem.wind.speed,
      windDegrees: weatherItem.wind.deg,
      windGust: weatherItem.wind.gust,
      icon:
        "//openweathermap.org/img/w/" +
        weatherItem.weather[0].icon +
        ".png",
      coordinates: [weatherItem.coord.Lon, weatherItem.coord.Lat],
    },
    geometry: {
      type: "Point",
      coordinates: [weatherItem.coord.Lon, weatherItem.coord.Lat],
    },
  };
  // Set the custom marker icon
  map.data.setStyle(function (feature) {
    return {
      icon: {
        url: feature.getProperty("icon"),
        anchor: new google.maps.Point(25, 25),
      },
    };
  });

  // returns object
  return feature;
};

// Add the markers to the map
var drawIcons = function (weather) {
  map.data.addGeoJson(geoJSON);
  // Set the flag to finished
  gettingData = false;
};

// Clear data layer and geoJSON
var resetData = function () {
  geoJSON = {
    type: "FeatureCollection",
    features: [],
  };
  map.data.forEach(function (feature) {
    map.data.remove(feature);
  });
};

google.maps.event.addDomListener(window, "load", initialize);


/*-----------------------------------------------*/
/* SEARCH BAR */
/*-----------------------------------------------*/

const handleSubmit = (e) => {
  e.preventDefault();
  let myForm = document.getElementById("location-form");
  let formData = new FormData(myForm);
  fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(formData).toString()
  })
    .then((data) => data.json())
    .then((data) => {
      myForm.reset();
      stylePageAfterInput();
      updateInformation(data);
    })
    .catch((error) => giveWarning());
};
document.getElementById("location-form").addEventListener("submit", handleSubmit);

function stylePageAfterInput() {
  document.querySelector(".hint").style.display = "none";
  document.querySelector(".weather-highlight").style.display = "grid";
}

function giveWarning() {
  document.querySelector(".hint").classList.add("error-message");
  document.querySelector(".hint").style.display = "grid";
  document.querySelector(".weather-highlight").style.display = "none";
  document.getElementById("hintText").textContent = "Error! Please make sure to enter the city name correctly";
  clearResults();
}

function updateInformation(data) {
  document.getElementById("temperature-digits").innerHTML = Math.round(data.temperature);
  document.getElementById("humidity").innerHTML = Math.round(data.humidity);
  document.getElementById("wind-speed").innerHTML = Math.round(data.windSpeed);
  document.getElementById("city-name").innerHTML = data.cityName;
  document.getElementById("country").innerHTML = data.country;
  document.getElementById("pressure").innerHTML = Math.round(data.pressure);
  document.getElementById("cloud-number").innerHTML = data.cloudNumber;
  document.getElementById("weather-description").innerHTML = data.weatherDescription;
  document.getElementById("illustration").innerHTML = "<img src ='" + data.weatherIconURL + "'>";
  document.getElementById("date-and-time").innerHTML = timeConverter(data.dateTime);
  document.getElementById("latitude").innerHTML = Math.round(data.latitude);
  document.getElementById("longitude").innerHTML = Math.round(data.longitude);
  initialize();
}

function clearResults () {
  document.getElementById("cloud-number").innerHTML = "";
  document.getElementById("wind-speed").innerHTML = "";
  document.getElementById("humidity").innerHTML = "";
  document.getElementById("pressure").innerHTML = "";
  document.getElementById("latitude").innerHTML = "";
  document.getElementById("longitude").innerHTML = "";
}

function timeConverter(UNIX_timestamp) {
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes() < 10 ? '0' + a.getMinutes() : a.getMinutes();
  var time = hour + ':' + min + ' on ' + month + ' ' + date + ', ' + year;
  return time;
}

function suggestionClicked(clickedButton) {
  document.getElementById("searchLocation").value = clickedButton;
  document.getElementById("submit-button").click();
}