package com.guillerme_backend.app.api.orders.dto;

public class OrderItemResponse {
    public Long productId;
    public String productNombre;
    public int qty;

    public OrderItemResponse(Long productId, String productNombre, int qty) {
        this.productId = productId;
        this.productNombre = productNombre;
        this.qty = qty;
    }
}
