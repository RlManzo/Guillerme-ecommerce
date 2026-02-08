package com.guillerme_backend.app.api.orders.dto;
import jakarta.validation.constraints.*;
import java.util.List;

public class CheckoutRequest {
    @NotEmpty
    public List<Item> items;

    public String comment;

    public static class Item {
        @NotNull
        public Long productId;

        @NotNull @Positive
        public Integer qty;
    }
}

