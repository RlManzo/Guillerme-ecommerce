package com.guillerme_backend.app.api.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ResetPasswordRequest {

    @NotBlank
    public String token;

    @NotBlank
    @Size(min = 8)
    public String newPassword;
}