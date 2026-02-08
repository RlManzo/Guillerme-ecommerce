package com.guillerme_backend.app.api.admin.orders.dto;

import com.guillerme_backend.app.domain.order.OrderStatus;

import java.time.Instant;

public class AdminOrderRow {

    public Long id;
    public Instant createdAt;
    public OrderStatus status;
    public String customerEmail;
    public String customerNombre;
    public String customerApellido;
    public Integer totalItems;

    public AdminOrderRow(
            Long id,
            Instant createdAt,
            OrderStatus status,
            String customerEmail,
            String customerNombre,
            String customerApellido,
            Integer totalItems
    ) {
        this.id = id;
        this.createdAt = createdAt;
        this.status = status;
        this.customerEmail = customerEmail;
        this.customerNombre = customerNombre;
        this.customerApellido = customerApellido;
        this.totalItems = totalItems;
    }
}
