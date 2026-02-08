package com.guillerme_backend.app.api.admin.orders.dto;

import com.guillerme_backend.app.domain.order.OrderStatus;

import java.time.Instant;
import java.time.OffsetDateTime;

public class OrderAdminSummaryResponse {
    public Long id;
    public Instant createdAt;
    public OrderStatus status;

    public String customerEmail;
    public String customerNombre;
    public String customerApellido;

    public Integer totalItems;

    public static OrderAdminSummaryResponse of(
            Long id,
            Instant createdAt,
            OrderStatus status,
            String customerEmail,
            String customerNombre,
            String customerApellido,
            Integer totalItems
    ) {
        OrderAdminSummaryResponse r = new OrderAdminSummaryResponse();
        r.id = id;
        r.createdAt = createdAt;
        r.status = status;
        r.customerEmail = customerEmail;
        r.customerNombre = customerNombre;
        r.customerApellido = customerApellido;
        r.totalItems = totalItems;
        return r;
    }
}
