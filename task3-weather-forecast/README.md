# Weather Forecast Service

This is a simple weather forecast service built with Java and Maven.

## Features
- Handles GET requests at `/weather?city={city}`.
- Retrieves city coordinates using Open Meteo Geocoding API.
- Fetches hourly temperature data using Open Meteo Forecast API.
- Caches data for 15 minutes.
- Displays a temperature chart for the last 24 hours using JFreeChart.

## Prerequisites
- Java 11+
- Maven
- Git

## Installation
1. Clone the repository: git clone https://github.com/Wedroll/test-task-junior-dev.git cd task3-weather-forecast
2. Install dependencies:
   mvn clean install

## Running the Server
mvn exec:java

## Usage
- Open `http://localhost:8080` in your browser for the welcome page.
- Use `http://localhost:8080/weather?city=Moscow` to see the forecast for Moscow.
