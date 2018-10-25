DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS weather;
DROP TABLE IF EXISTS yelp;
DROP TABLE IF EXISTS movies;

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude NUMERIC(8,6),
  longitude NUMERIC(9,6)
);

CREATE TABLE weather (
  id SERIAL PRIMARY KEY,
  forecast VARCHAR(255),
  time VARCHAR(255)
);

CREATE TABLE yelp (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  image_url VARCHAR(255),
  price MONEY,
  rating NUMERIC(10,9),
  url VARCHAR(255)
);

CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  overview VARCHAR(255),
  average_votes NUMERIC(3,2),
  total_votes INTEGER,
  image_url VARCHAR(255),
  popularity NUMERIC(10,8),
  released_on VARCHAR(255)
);