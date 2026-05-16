package com.guillerme_backend.app.service;

import com.guillerme_backend.app.domain.customer.CustomerRepository;
import com.guillerme_backend.app.domain.customer.dto.AdminCustomerUserResponse;
import com.guillerme_backend.app.domain.user.Role;
import com.guillerme_backend.app.domain.user.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminCustomerService {

    private final CustomerRepository customerRepository;

    public AdminCustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<AdminCustomerUserResponse> findAllRegisteredUsers() {
        return customerRepository.findAllByUserRole(Role.USER)
                .stream()
                .map(customer -> {
                    User user = customer.getUser();

                    return new AdminCustomerUserResponse(
                            user.getId(),
                            user.getEmail(),
                            user.getRole(),
                            user.isEnabled(),
                            user.isEmailVerified(),
                            user.getCreatedAt(),
                            user.getUpdatedAt(),
                            customer.getNombre(),
                            customer.getApellido(),
                            customer.getTelefono(),
                            customer.getDireccion(),
                            customer.getDocumento()
                    );
                })
                .toList();
    }
}
