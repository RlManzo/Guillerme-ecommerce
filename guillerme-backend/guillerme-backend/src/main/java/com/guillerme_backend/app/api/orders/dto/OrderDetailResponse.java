package com.guillerme_backend.app.api.orders.dto;

import java.time.Instant;
import java.util.List;

public class OrderDetailResponse {
    public Long id;
    public Instant createdAt;

    public String customerNombre;
    public String customerApellido;
    public String customerEmail;
    public String customerTelefono;
    public String customerDireccion;

    public String comment;
    public List<OrderItemResponse> items;

    public OrderDetailResponse(
            Long id, Instant createdAt,
            String customerNombre, String customerApellido, String customerEmail,
            String customerTelefono, String customerDireccion,
            String comment,
            List<OrderItemResponse> items
    ) {
        this.id = id;
        this.createdAt = createdAt;
        this.customerNombre = customerNombre;
        this.customerApellido = customerApellido;
        this.customerEmail = customerEmail;
        this.customerTelefono = customerTelefono;
        this.customerDireccion = customerDireccion;
        this.comment = comment;
        this.items = items;
    }
}
