'use strict';

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

require('dotenv').config();

const PORT = process.env.PORT || 3000;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('err', err => console.log(err));

const app = express();

app.use(cors());

app.get('/weather', searchWeatherData);
app.get('/yelp', getYelp);
app.get('/movies', getMovies);

app.get('/location', searchToLatLong);

function searchToLatLong(req, res) {
  const locationHandler = {
    query: req.query.data,

    cacheHit: results => {
      console.log('Got Data from SQL');
      res.send(results.rows[0]);
    },

    cacheMiss: () => {
      Location.fetchLocation(req.query.data).then(data => res.send(data));
    }
  };

  Location.lookupLocation(locationHandler);
}

Location.lookupLocation = handler => {
  const SQL = `SELECT * FROM locations WHERE search_query=$1`;
  const values = [handler.query];

  return client.query(SQL, values)
    .then(result => {
      if (result.rowCount > 0) {
        handler.cacheHit(result);
      } else {
        handler.cacheMiss();
      }
    })
    .catch(console.error);
};

function Location(query, data) {
  this.search_query = query;
  this.formatted_query = data.formatted_address;
  this.latitude = data.geometry.location.lat;
  this.longitude = data.geometry.location.lng;
}
Location.prototype.save = function() {
  let SQL = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)`;
  let values = Object.values(this);

  client.query(SQL, values);
};

Location.fetchLocation = query => {
  const URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GOOGLE_API_KEY}`;
  return superagent.get(URL)
    .then(data => {
      console.log('Got Data from API');
      if(! data.body.results.length) {throw 'No Data';}
      else {
        let location = new Location(query, data.body.results[0]);
        // console.log(data.body);
        location.save();
        return location;
      }
    });
};

// app.get('/weather', (request,response) => {
//   const forcastData = searchWeatherData(request.query.data);
//   response.send(forcastData);
// });

function searchWeatherData(request, response) {
  const URL = `https://api.darksky.net/forecast/${
    process.env.WEATHER_API_KEY
  }/${request.query.data.latitude},${request.query.data.longitude}`;

  return superagent
    .get(URL)
    .then(result => {
      // console.log(result.body.daily);
      const weatherSummaries = result.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.send(weatherSummaries);
    })
    .catch(error => handleError(error, response));
}

function Weather(data) {
  this.time = new Date(data.time * 1000).toString().slice(0, 15);
  this.forecast = data.summary;
  // console.log(data.summary);
}

function getYelp(request, response) {
  const URL = `https://api.yelp.com/v3/businesses/search?term=delis&latitude=${
    request.query.data.latitude
  }&longitude=${request.query.data.longitude}`;

  return superagent
    .get(URL)
    .set({ Authorization: 'Bearer ' + process.env.YELP_API_KEY })
    .then(result => {
      // console.log(result.body);
      const yelpSummaries = result.body.businesses.map(businesses => {
        return new Yelp(businesses);
      });
      response.send(yelpSummaries);
    })
    .catch(error => handleError(error, response));
}

function Yelp(data) {
  this.name = data.name;
  this.image_url = data.image_url;
  this.price = data.price;
  this.rating = data.rating;
  this.url = this.url;
}

function getMovies(request, response) {
  const URL = `https://api.themoviedb.org/3/search/movie?api_key=${
    process.env.MOVIES_API_KEY
  }&query=${request.query.data.search_query}`;

  return superagent
    .get(URL)
    .then(result => {
      console.log(result.body);
      const movieSummaries = result.body.results.map(movies => {
        return new Movie(movies);
      });
      console.log(movieSummaries);
      response.send(movieSummaries);
    })
    .catch(error => handleError(error, response));
}

function Movie(data) {
  this.title = data.title;
  this.overview = data.overview;
  this.average_votes = data.vote_average;
  this.total_votes = data.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w200_and_h300_bestv2${
    data.poster_path
  }`;
  this.popularity = data.popularity;
  this.released_on = data.release_date;
}

function handleError(err, res) {
  console.error('ERR', err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

app.listen(PORT, () => console.log(`App is up on ${PORT}`));
