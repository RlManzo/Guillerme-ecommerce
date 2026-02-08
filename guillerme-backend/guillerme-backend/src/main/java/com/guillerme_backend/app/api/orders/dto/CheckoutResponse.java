package com.guillerme_backend.app.api.orders.dto;

public class CheckoutResponse {
    public Long orderId;
    public CheckoutResponse(Long orderId) { this.orderId = orderId; }
}
