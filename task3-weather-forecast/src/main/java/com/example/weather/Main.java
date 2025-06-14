package com.example.weather;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;

public class Main {
    public static void main(String[] args) throws IOException {
        ServerSocket serverSocket = new ServerSocket(8080);
        System.out.println("Server started on port 8080");

        while (true) {
            Socket clientSocket = serverSocket.accept();
            PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true);
            BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
            String line;
            String request = "";
            while ((line = in.readLine()) != null && !line.isEmpty()) {
                request += line + "\n";
                if (line.startsWith("GET")) {
                    out.println("HTTP/1.1 200 OK");
                    out.println("Content-Type: text/html");
                    out.println();
                    out.println("<h1>Welcome to Weather Service!</h1>");
                    out.println("<p>Send a GET request with ?city={city} to get weather data.</p>");
                    break;
                }
            }
            clientSocket.close();
        }
    }
}