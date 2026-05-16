package com.guillerme_backend.app.api.admin.customers;

import com.guillerme_backend.app.domain.customer.dto.AdminCustomerUserResponse;
import com.guillerme_backend.app.service.AdminCustomerService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/customers")
public class AdminCustomerController {

    private final AdminCustomerService adminCustomerService;

    public AdminCustomerController(AdminCustomerService adminCustomerService) {
        this.adminCustomerService = adminCustomerService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminCustomerUserResponse> findAllRegisteredUsers() {
        return adminCustomerService.findAllRegisteredUsers();
    }
}