package com.guillerme_backend.app.api.cart.dto;

import java.util.List;

public class CartResponse {
    public Long id;
    public List<CartItemResponse> items;
    public int totalItems;
}