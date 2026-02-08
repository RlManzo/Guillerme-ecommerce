package com.guillerme_backend.app.api.cart.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CartReplaceRequest {
    @NotNull @Valid
    public List<CartReplaceItemRequest> items;
}