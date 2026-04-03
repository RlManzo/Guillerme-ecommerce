package com.guillerme_backend.app.api.orders.dto;

import java.math.BigDecimal;

public class OrderItemResponse {
    public Long productId;
    public String productNombre;
    public int qty;
    public BigDecimal unitPrice;

    public OrderItemResponse(Long productId, String productNombre, int qty, BigDecimal unitPrice) {
        this.productId = productId;
        this.productNombre = productNombre;
        this.qty = qty;
        this.unitPrice = unitPrice;
    }
}