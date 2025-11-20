package com.summarizer.dto;

public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private String email;

    // Default constructor
    public AuthResponse() {}

    // Constructor with token
    public AuthResponse(String token, String email) {
        this.token = token;
        this.email = email;
    }

    // Getters and setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}