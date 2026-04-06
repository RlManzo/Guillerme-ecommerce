package com.guillerme_backend.app.service;

import com.guillerme_backend.app.api.account.dto.ProfileResponse;
import com.guillerme_backend.app.api.account.dto.UpdateProfileRequest;
import com.guillerme_backend.app.domain.customer.Customer;
import com.guillerme_backend.app.domain.customer.CustomerRepository;
import com.guillerme_backend.app.domain.user.User;
import com.guillerme_backend.app.domain.user.UserRepository;
import com.guillerme_backend.app.exception.NotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class AccountService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    public AccountService(
            UserRepository userRepository,
            CustomerRepository customerRepository
    ) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional
    public ProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new NotFoundException("Perfil de cliente no encontrado"));

        return toResponse(user, customer);
    }

    @Transactional
    public ProfileResponse updateProfile(String email, UpdateProfileRequest req) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new NotFoundException("Perfil de cliente no encontrado"));

        String documento = onlyDigits(req.documento);


        // si viene vacío → lo dejamos null
                if (documento.isBlank()) {
                    customer.setDocumento(null);
                } else {
                    if (customerRepository.existsByDocumentoAndUserIdNot(documento, user.getId())) {
                        throw new IllegalArgumentException("El documento ya está registrado");
                    }

                    customer.setDocumento(documento);
                }

        if (customerRepository.existsByDocumentoAndUserIdNot(documento, user.getId())) {
            throw new IllegalArgumentException("El documento ya está registrado");
        }

        customer.setNombre(req.nombre == null ? null : req.nombre.trim());
        customer.setApellido(req.apellido == null ? null : req.apellido.trim());
        customer.setDocumento(documento);
        customer.setTelefono(req.telefono == null ? null : req.telefono.trim());
        customer.setDireccion(req.direccion == null ? null : req.direccion.trim());

        customerRepository.save(customer);

        return toResponse(user, customer);
    }

    private ProfileResponse toResponse(User user, Customer customer) {
        ProfileResponse r = new ProfileResponse();
        r.email = user.getEmail();
        r.nombre = customer.getNombre();
        r.apellido = customer.getApellido();
        r.documento = customer.getDocumento();
        r.telefono = customer.getTelefono();
        r.direccion = customer.getDireccion();
        return r;
    }

    private String onlyDigits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }
}