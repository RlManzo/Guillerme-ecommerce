package com.guillerme_backend.app.api.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @NotBlank
    public String nombre;

    @NotBlank
    public String apellido;


    @Size(min = 7, max = 12)
    public String documento;

    @NotBlank
    public String telefono;

    @NotBlank
    public String direccion;
}