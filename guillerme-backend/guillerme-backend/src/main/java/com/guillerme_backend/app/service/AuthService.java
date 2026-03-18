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

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder encoder,
            AuthenticationManager authManager,
            JwtService jwtService, CustomerRepository customerRepository, PasswordEncoder passwordEncoder, MailService mailService
    ) {
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.authManager = authManager;
        this.jwtService = jwtService;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
    }

    @Transactional
    public void register(RegisterRequest req) {

        if (userRepository.existsByEmail(req.email)) {
            throw new IllegalArgumentException("Email ya registrado");
        }

        String token = UUID.randomUUID().toString();

        User u = new User();
        u.setEmail(req.email.trim().toLowerCase());
        u.setPasswordHash(passwordEncoder.encode(req.password));
        u.setRole(Role.USER);

        // ✅ clave
        u.setEnabled(true); // lo dejamos true para evitar conflictos con Spring
        u.setEmailVerified(false);

        u.setVerificationToken(token);
        u.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));

        u = userRepository.save(u);

        Customer c = new Customer();
        c.setUser(u);
        c.setNombre(req.nombre);
        c.setApellido(req.apellido);
        c.setTelefono(req.telefono);
        c.setDireccion(req.direccion);

        customerRepository.save(c);

        // ✅ enviar mail
        mailService.sendVerificationEmail(u.getEmail(), token);
    }

    public String login(String email, String password) {

        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        // ✅ CLAVE
        if (!u.isEmailVerified()) {
            throw new IllegalStateException("Debés verificar tu email antes de ingresar");
        }

        return jwtService.generateToken(u.getEmail(), u.getRole());
    }

    @Transactional
    public void verifyEmail(String token) {

        User u = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token inválido"));

        if (u.getVerificationTokenExpiresAt() == null ||
                u.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("El token venció");
        }

        u.setEmailVerified(true);
        u.setVerificationToken(null);
        u.setVerificationTokenExpiresAt(null);
    }
}
