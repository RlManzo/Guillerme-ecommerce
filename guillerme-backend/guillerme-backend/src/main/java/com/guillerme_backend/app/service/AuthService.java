package com.guillerme_backend.app.service;

import com.guillerme_backend.app.api.auth.dto.RegisterRequest;
import com.guillerme_backend.app.domain.customer.Customer;
import com.guillerme_backend.app.domain.customer.CustomerRepository;
import com.guillerme_backend.app.domain.user.Role;
import com.guillerme_backend.app.domain.user.User;
import com.guillerme_backend.app.domain.user.UserRepository;
import com.guillerme_backend.app.exception.ConflictException;
import com.guillerme_backend.app.security.JwtService;
import jakarta.transaction.Transactional;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder encoder,
            AuthenticationManager authManager,
            JwtService jwtService, CustomerRepository customerRepository, PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.authManager = authManager;
        this.jwtService = jwtService;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public String register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email)) {
            throw new IllegalArgumentException("Email ya registrado");
        }

        User u = new User();
        u.setEmail(req.email);
        u.setPasswordHash(passwordEncoder.encode(req.password));
        u.setRole(Role.valueOf("USER"));
        u.setEnabled(true);

        u = userRepository.save(u);

        Customer c = new Customer();
        c.setUser(u);
        c.setNombre(req.nombre);
        c.setApellido(req.apellido);
        c.setTelefono(req.telefono);
        c.setDireccion(req.direccion);

        customerRepository.save(c);

        return jwtService.generateToken(u.getEmail(), u.getRole());
    }

    public String login(String email, String password) {
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        return jwtService.generateToken(u.getEmail(), u.getRole());
    }
}
