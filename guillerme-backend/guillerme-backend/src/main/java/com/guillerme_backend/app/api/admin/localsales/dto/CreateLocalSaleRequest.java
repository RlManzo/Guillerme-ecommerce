package com.guillerme_backend.app.api.admin.localsales.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class CreateLocalSaleRequest {
    @NotEmpty
    public List<Item> items;

    public String comment;
    public String customerName;

    public static class Item {
        @NotNull
        public Long productId;

        @NotNull
        @Min(1)
        public Integer qty;
    }
}
