package com.guillerme_backend.app.api.products.dto;

import jakarta.validation.constraints.NotNull;

public class UpdateProductEstadoRequest {
    @NotNull
    public Boolean estado;
}
