package com.guillerme_backend.app.api.admin.orders.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class RemoveOrderItemsRequest {

    @NotEmpty
    public List<@NotNull Long> productIdsToKeep;

    public String adminComment;
}