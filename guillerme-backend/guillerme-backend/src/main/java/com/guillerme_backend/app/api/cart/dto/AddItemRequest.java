package com.guillerme_backend.app.api.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class AddItemRequest {
    @NotNull
    public Long productId;

    @Min(1)
    public int qty;
}