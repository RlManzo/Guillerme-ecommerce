package com.guillerme_backend.app.api.auth;

import com.guillerme_backend.app.api.auth.dto.*;
import com.guillerme_backend.app.domain.user.UserRepository;
import com.guillerme_backend.app.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public MessageResponse register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return new MessageResponse("Te enviamos un email para verificar tu cuenta");
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        String token = authService.login(req.email, req.password);
        return new AuthResponse(token);
    }

    @GetMapping("/me")
    public MeResponse me(Authentication auth) {
        String email = auth.getName();
        var u = userRepository.findByEmail(email).orElseThrow();
        return new MeResponse(u.getEmail(), u.getRole().name());
    }

    @PostMapping("/verify-email")
    public MessageResponse verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return new MessageResponse("Cuenta verificada correctamente");
    }
}
