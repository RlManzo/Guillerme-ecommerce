package com.guillerme_backend.app.api.admin.orders.dto;

import com.guillerme_backend.app.domain.order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateOrderStatusRequest {
    @NotNull
    public OrderStatus status;
}