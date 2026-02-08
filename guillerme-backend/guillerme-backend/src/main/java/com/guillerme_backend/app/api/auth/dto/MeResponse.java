package com.guillerme_backend.app.api.auth.dto;

public class MeResponse {
    public String email;
    public String role;

    public MeResponse(String email, String role) {
        this.email = email;
        this.role = role;
    }
}