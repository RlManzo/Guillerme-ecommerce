package com.guillerme_backend.app.service;

import com.guillerme_backend.app.api.auth.dto.ForgotPasswordRequest;
import com.guillerme_backend.app.api.auth.dto.RegisterRequest;
import com.guillerme_backend.app.api.auth.dto.ResetPasswordRequest;
import com.guillerme_backend.app.domain.customer.Customer;
import com.guillerme_backend.app.domain.customer.CustomerRepository;
import com.guillerme_backend.app.domain.user.Role;
import com.guillerme_backend.app.domain.user.User;
import com.guillerme_backend.app.domain.user.UserRepository;
import com.guillerme_backend.app.security.JwtService;
import jakarta.transaction.Transactional;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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
            JwtService jwtService,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            MailService mailService
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

        String email = req.email == null ? "" : req.email.trim().toLowerCase();
        String documento = req.documento == null ? "" : req.documento.trim();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email ya registrado");
        }

        if (customerRepository.existsByDocumento(documento)) {
            throw new IllegalArgumentException("Documento ya registrado");
        }

        String token = UUID.randomUUID().toString();

        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode(req.password));
        u.setRole(Role.USER);
        u.setEnabled(true);
        u.setEmailVerified(false);
        u.setVerificationToken(token);
        u.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));

        u = userRepository.save(u);

        Customer c = new Customer();
        c.setUser(u);
        c.setNombre(req.nombre);
        c.setApellido(req.apellido);
        c.setDocumento(documento);
        c.setTelefono(req.telefono);
        c.setDireccion(req.direccion);

        customerRepository.save(c);

        mailService.sendVerificationEmail(u.getEmail(), token);
    }

    public String login(String email, String password) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

        } catch (BadCredentialsException e) {

            throw new BadCredentialsException("Email o contraseña incorrectos");
        }

        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

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

    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest req) {
        String email = req.email == null ? "" : req.email.trim().toLowerCase();

        userRepository.findByEmail(email).ifPresent(u -> {
            String token = UUID.randomUUID().toString();

            u.setPasswordResetToken(token);
            u.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusHours(2));

            userRepository.save(u);

            mailService.sendPasswordResetEmail(u.getEmail(), token);
        });

        // OJO: no tirar error si no existe, para no filtrar usuarios válidos
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        User u = userRepository.findByPasswordResetToken(req.token)
                .orElseThrow(() -> new IllegalArgumentException("Token inválido"));

        if (u.getPasswordResetTokenExpiresAt() == null ||
                u.getPasswordResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("El token venció");
        }

        u.setPasswordHash(passwordEncoder.encode(req.newPassword));
        u.setPasswordResetToken(null);
        u.setPasswordResetTokenExpiresAt(null);

        userRepository.save(u);
    }
}