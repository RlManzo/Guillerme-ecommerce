package com.guillerme_backend.app.api.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CartReplaceItemRequest {
    @NotNull
    public Long productId;

    @Min(0)
    public int qty;
}