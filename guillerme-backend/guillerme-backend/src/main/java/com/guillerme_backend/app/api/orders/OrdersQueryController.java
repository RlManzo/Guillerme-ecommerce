package com.guillerme_backend.app.api.orders;

import com.guillerme_backend.app.api.orders.dto.*;
import com.guillerme_backend.app.service.OrdersQueryService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrdersQueryController {

    private final OrdersQueryService service;

    public OrdersQueryController(OrdersQueryService service) {
        this.service = service;
    }

    @GetMapping
    public List<OrderSummaryResponse> myOrders(Authentication auth) {
        return service.myOrders(auth.getName());
    }

    @GetMapping("/{id}")
    public OrderDetailResponse myOrderDetail(@PathVariable Long id, Authentication auth) {
        return service.myOrderDetail(auth.getName(), id);
    }
}
