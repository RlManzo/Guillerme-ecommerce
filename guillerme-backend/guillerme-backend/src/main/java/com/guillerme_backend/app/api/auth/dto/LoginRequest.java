package com.guillerme_backend.app.api.auth.dto;

import jakarta.validation.constraints.*;

public class LoginRequest {
    @Email @NotBlank
    public String email;

    @NotBlank
    public String password;
}
