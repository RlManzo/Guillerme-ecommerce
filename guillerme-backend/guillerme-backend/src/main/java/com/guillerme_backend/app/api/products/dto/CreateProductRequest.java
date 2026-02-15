package com.guillerme_backend.app.api.products.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public class CreateProductRequest {

    @NotBlank
    public String nombre;

    public String descripcionCorta;
    public String infoModal;
    public String imgUrl;
    public String imgUrl2;
    public String imgUrl3;


    // MVP: vienen como string (CSV o JSON string)
    public String categorias;
    public String servicios;
    public String keywords;

    public Boolean activo;

    @NotNull
    @PositiveOrZero
    public Integer stock;

    @NotNull
    @DecimalMin("0.00")
    public BigDecimal precio;

    public Boolean estado;

}
