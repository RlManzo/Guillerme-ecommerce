package com.guillerme_backend.app.api.auth.dto;

import jakarta.validation.constraints.*;

public class RegisterRequest {

    @Email @NotBlank
    public String email;

    @NotBlank @Size(min = 6, max = 72)
    public String password;

    @NotBlank @Size(max = 120)
    public String nombre;

    @NotBlank @Size(max = 120)
    public String apellido;

    @NotBlank @Size(max = 40)
    public String telefono;

    @NotBlank @Size(max = 300)
    public String direccion;
}
