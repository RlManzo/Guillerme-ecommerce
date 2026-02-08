package com.guillerme_backend.app.api.admin.orders;

import com.guillerme_backend.app.api.admin.orders.dto.OrderAdminDetailResponse;
import com.guillerme_backend.app.api.admin.orders.dto.OrderAdminSummaryResponse;
import com.guillerme_backend.app.api.admin.orders.dto.UpdateOrderStatusRequest;
import com.guillerme_backend.app.domain.order.OrderStatus;
import com.guillerme_backend.app.service.AdminOrdersService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')") // ✅ protege todo el controller
public class AdminOrdersController {

    private final AdminOrdersService service;

    public AdminOrdersController(AdminOrdersService service) {
        this.service = service;
    }

    @GetMapping
    public Page<OrderAdminSummaryResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String from, // YYYY-MM-DD
            @RequestParam(required = false) String to,   // YYYY-MM-DD
            Pageable pageable
    ) {
        return service.search(q, status, from, to, pageable);
    }

    @GetMapping("/{id}")
    public OrderAdminDetailResponse detail(@PathVariable Long id) {
        return service.getDetail(id);
    }

    @PatchMapping("/{id}/status")
    public void updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateOrderStatusRequest req) {
        service.updateStatus(id, req.status);
    }
}
