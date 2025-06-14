package com.example.weather;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLEncoder;

import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.json.JSONObject;

public class Main {
    private static final String GEO_API_URL = "https://geocoding-api.open-meteo.com/v1/search?name=";

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
                        }
                    }
                }
            }

            if (city != null) {
                double[] coords = getCityCoordinates(city);
                if (coords != null) {
                    out.println("HTTP/1.1 200 OK");
                    out.println("Content-Type: text/html");
                    out.println();
                    out.println("<!DOCTYPE html><html><head><title>Weather Forecast</title></head><body>");
                    out.println("<h1>Weather Forecast for " + city + "</h1>");
                    out.println("<p>Latitude: " + coords[0] + ", Longitude: " + coords[1] + "</p>");
                    out.println("<p>Weather data will be added soon...</p>");
                    out.println("</body></html>");
                } else {
                    sendErrorResponse(out, "City not found: " + city);
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
        CloseableHttpClient client = HttpClients.createDefault();
        HttpGet request = new HttpGet(GEO_API_URL + city);
        try (CloseableHttpResponse response = client.execute(request)) {
            String json = EntityUtils.toString(response.getEntity());
            JSONObject obj = new JSONObject(json);
            if (obj.has("results") && obj.getJSONArray("results").length() > 0) {
                JSONObject result = obj.getJSONArray("results").getJSONObject(0);
                return new double[]{result.getDouble("latitude"), result.getDouble("longitude")};
            }
            return null;
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