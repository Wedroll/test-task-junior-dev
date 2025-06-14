package com.example.weather;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLEncoder;
import java.nio.file.Files;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.json.JSONArray;
import org.json.JSONObject;

import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.chart.ChartUtils;

public class Main {
    private static final String GEO_API_URL = "https://geocoding-api.open-meteo.com/v1/search?name=";
    private static final String WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m";
    private static final int CACHE_TTL_MINUTES = 15;
    private static final Map<String, CacheEntry> cache = new HashMap<>();

    static class CacheEntry {
        JSONObject weatherData;
        long expiryTime;

        CacheEntry(JSONObject data, long expiryTime) {
            this.weatherData = data;
            this.expiryTime = expiryTime;
        }
    }

    public static void main(String[] args) throws IOException {
        ServerSocket serverSocket = new ServerSocket(8080);
        System.out.println("Server started on port 8080");

        while (true) {
            Socket clientSocket = serverSocket.accept();
            PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true);
            BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
            String line;
            String request = "";
            String city = null;

            while ((line = in.readLine()) != null && !line.isEmpty()) {
                request += line + "\n";
                if (line.startsWith("GET")) {
                    String[] parts = line.split("\\s+");
                    if (parts.length > 1) {
                        String path = parts[1];
                        if (path.startsWith("/weather?city=")) {
                            city = path.substring("/weather?city=".length());
                            if (city.contains("&")) {
                                city = city.substring(0, city.indexOf("&"));
                            }
                            city = URLEncoder.encode(city, "UTF-8").replace("+", "%20");
                        } else if (path.equals("/temperature_chart.png")) {
                            serveImage(out, in, clientSocket);
                            clientSocket.close();
                            continue;
                        }
                    }
                }
            }

            if (city != null) {
                JSONObject weatherData = getWeatherData(city);
                if (weatherData != null) {
                    generateTemperatureChart(weatherData, city);
                    out.println("HTTP/1.1 200 OK");
                    out.println("Content-Type: text/html");
                    out.println();
                    out.println("<!DOCTYPE html><html><head><title>Weather Forecast</title></head><body>");
                    out.println("<h1>Weather Forecast for " + city + "</h1>");
                    double[] coords = getCityCoordinates(city);
                    out.println("<p>Latitude: " + coords[0] + ", Longitude: " + coords[1] + "</p>");
                    out.println("<img src='/temperature_chart.png' alt='Temperature Chart'>");
                    out.println("</body></html>");
                } else {
                    sendErrorResponse(out, "Failed to fetch weather data for: " + city);
                }
            } else {
                out.println("HTTP/1.1 200 OK");
                out.println("Content-Type: text/html");
                out.println();
                out.println("<h1>Welcome to Weather Service!</h1>");
                out.println("<p>Send a GET request with ?city={city} to get weather data (e.g., ?city=Moscow).</p>");
            }
            clientSocket.close();
        }
    }

    private static double[] getCityCoordinates(String city) throws IOException {
        CacheEntry cachedCoords = cache.get("coords_" + city);
        if (cachedCoords != null && Instant.now().toEpochMilli() < cachedCoords.expiryTime) {
            JSONObject data = cachedCoords.weatherData;
            if (data.has("results") && data.getJSONArray("results").length() > 0) {
                JSONObject result = data.getJSONArray("results").getJSONObject(0);
                return new double[]{result.getDouble("latitude"), result.getDouble("longitude")};
            }
        }

        CloseableHttpClient client = HttpClients.createDefault();
        HttpGet request = new HttpGet(GEO_API_URL + city);
        try (CloseableHttpResponse response = client.execute(request)) {
            String json = EntityUtils.toString(response.getEntity());
            JSONObject obj = new JSONObject(json);
            if (obj.has("results") && obj.getJSONArray("results").length() > 0) {
                cache.put("coords_" + city, new CacheEntry(obj, Instant.now().toEpochMilli() + CACHE_TTL_MINUTES * 60 * 1000));
                JSONObject result = obj.getJSONArray("results").getJSONObject(0);
                return new double[]{result.getDouble("latitude"), result.getDouble("longitude")};
            }
            return null;
        }
    }

    private static JSONObject getWeatherData(String city) throws IOException {
        double[] coords = getCityCoordinates(city);
        if (coords == null) return null;

        CacheEntry cachedWeather = cache.get("weather_" + city);
        if (cachedWeather != null && Instant.now().toEpochMilli() < cachedWeather.expiryTime) {
            return cachedWeather.weatherData;
        }

        CloseableHttpClient client = HttpClients.createDefault();
        String url = WEATHER_API_URL.replace("{lat}", String.valueOf(coords[0])).replace("{lon}", String.valueOf(coords[1]));
        HttpGet request = new HttpGet(url);
        try (CloseableHttpResponse response = client.execute(request)) {
            String json = EntityUtils.toString(response.getEntity());
            JSONObject obj = new JSONObject(json);
            cache.put("weather_" + city, new CacheEntry(obj, Instant.now().toEpochMilli() + CACHE_TTL_MINUTES * 60 * 1000));
            return obj;
        }
    }

    private static void generateTemperatureChart(JSONObject weatherData, String city) throws IOException {
        System.out.println("Generating chart for " + city);
        if (!weatherData.has("hourly") || weatherData.isNull("hourly")) {
            System.out.println("No hourly data available for " + city);
            return;
        }

        JSONObject hourly = weatherData.getJSONObject("hourly");
        JSONArray temperatures = hourly.getJSONArray("temperature_2m");
        JSONArray times = hourly.getJSONArray("time");
        System.out.println("Temperatures length: " + temperatures.length());
        System.out.println("Times length: " + times.length());

        if (temperatures.length() == 0 || times.length() == 0) {
            System.out.println("No temperature or time data available");
            return;
        }

        DefaultCategoryDataset dataset = new DefaultCategoryDataset();
        for (int i = 0; i < Math.min(temperatures.length(), 24); i++) {
            String time = times.getString(i).substring(11, 16);
            dataset.addValue(temperatures.getDouble(i), "Temperature (°C)", time);
        }

        JFreeChart chart = ChartFactory.createBarChart(
                "Temperature for " + city,
                "Time",
                "Temperature (°C)",
                dataset,
                PlotOrientation.VERTICAL,
                false, false, false
        );

        ChartUtils.saveChartAsPNG(new File("temperature_chart.png"), chart, 600, 400);
        System.out.println("Chart saved as temperature_chart.png");
    }

    private static void serveImage(PrintWriter out, BufferedReader in, Socket clientSocket) throws IOException {
        File file = new File("temperature_chart.png");
        if (file.exists()) {
            out.println("HTTP/1.1 200 OK");
            out.println("Content-Type: image/png");
            out.println();
            Files.copy(file.toPath(), clientSocket.getOutputStream());
        } else {
            out.println("HTTP/1.1 404 Not Found");
            out.println("Content-Type: text/html");
            out.println();
            out.println("<h1>File Not Found</h1>");
        }
    }

    private static void sendErrorResponse(PrintWriter out, String message) {
        out.println("HTTP/1.1 404 Not Found");
        out.println("Content-Type: text/html");
        out.println();
        out.println("<!DOCTYPE html><html><head><title>Error</title></head><body>");
        out.println("<h1>Error</h1><p>" + message + "</p></body></html>");
        out.flush();
    }
}