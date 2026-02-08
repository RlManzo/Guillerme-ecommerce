package com.guillerme_backend.app.api.orders;

import com.guillerme_backend.app.api.orders.dto.CheckoutRequest;
import com.guillerme_backend.app.api.orders.dto.CheckoutResponse;
import com.guillerme_backend.app.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/checkout")
    public CheckoutResponse checkout(@Valid @RequestBody CheckoutRequest req,
                                     Authentication auth) {
        String email = auth.getName();
        Long id = orderService.checkout(email, req);
        return new CheckoutResponse(id);
    }
}
