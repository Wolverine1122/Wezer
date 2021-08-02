// Imports
const express = require("express");
const https = require ("https");
const bodyParser = require("body-parser");

//Security
require("dotenv").config();

const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json()) // To parse the incoming requests with JSON payloads

//Static Files
app.use(express.static(__dirname + '/public'));

app.post("/", function(req, res) {
    var city = req.body.searchLocation;

    if (city === "") {
        return true;
    }

    var degreeUnit = "metric";
    const APIKey = process.env.OPEN_WEATHER_API_KEY;
    const url = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=" + degreeUnit + "&appid=" + APIKey;

    https.get(url, function (response) {
        if (response.statusCode == 404) {
            res.sendStatus(400);
            return true;
        }
        response.on("data", function (data) {
            const weatherData = JSON.parse(data);
            const temperature = weatherData.main.temp;
            const humidity = weatherData.main.humidity;
            const windSpeed = weatherData.wind.speed;
            const country = weatherData.sys.country;
            const cityName = weatherData.name;
            const weatherDescription = weatherData.weather[0].description;
            const pressure = weatherData.main.pressure;
            const dateTime = weatherData.dt;
            const cloudNumber = weatherData.clouds.all;
            const longitude = weatherData.coord.lon;
            const latitude = weatherData.coord.lat;
            const weatherIconURL = "//openweathermap.org/img/wn/" + weatherData.weather[0].icon + "@2x.png";

            res.json({temperature, humidity, windSpeed, country, cityName, weatherDescription, pressure, dateTime, weatherIconURL, cloudNumber, latitude, longitude});
        })
    })
})

app.listen(process.env.PORT || 3000)