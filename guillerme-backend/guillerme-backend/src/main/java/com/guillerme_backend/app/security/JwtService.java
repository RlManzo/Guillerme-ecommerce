package com.guillerme_backend.app.security;

import com.guillerme_backend.app.domain.user.Role;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    private final Key key;
    private final long userExpirationMinutes;
    private final long adminExpirationMinutes;
    private final long operadorExpirationMinutes;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-user-minutes}") long userExpirationMinutes,
            @Value("${app.jwt.expiration-admin-minutes}") long adminExpirationMinutes,
            @Value("${app.jwt.expiration-operador-minutes}") long operadorExpirationMinutes
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.userExpirationMinutes = userExpirationMinutes;
        this.adminExpirationMinutes = adminExpirationMinutes;
        this.operadorExpirationMinutes = operadorExpirationMinutes;
    }

    public String generateToken(String email, Role role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role.name());

        long expirationMinutes = getExpirationMinutesByRole(role);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(Date.from(
                        Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES)
                ))
                .signWith(key)
                .compact();
    }

    private long getExpirationMinutesByRole(Role role) {
        if (role == Role.ADMIN) {
            return adminExpirationMinutes;
        }

        if (role == Role.OPERADOR) {
            return operadorExpirationMinutes;
        }

        return userExpirationMinutes;
    }

    public String extractSubject(String token) {
        return parseClaims(token).getBody().getSubject();
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Jws<Claims> parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
    }
}