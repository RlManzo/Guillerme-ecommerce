package com.guillerme_backend.app.api.admin.orders.dto;

import com.guillerme_backend.app.domain.order.OrderStatus;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

public class OrderAdminDetailResponse {
    public Long id;
    public Instant createdAt;
    public OrderStatus status;

    public String customerEmail;
    public String customerNombre;
    public String customerApellido;
    public String customerTelefono;
    public String customerDireccion;

    public String comment;
    public List<Item> items;

    public static class Item {
        public Long productId;
        public String productNombre;
        public Integer qty;
        public String imgUrl;
        public java.math.BigDecimal unitPrice;
    }
}
