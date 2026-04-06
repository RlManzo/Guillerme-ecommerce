package com.guillerme_backend.app.api.account;

import com.guillerme_backend.app.api.account.dto.ProfileResponse;
import com.guillerme_backend.app.api.account.dto.UpdateProfileRequest;
import com.guillerme_backend.app.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/profile")
    public ProfileResponse getProfile(Authentication auth) {
        return accountService.getProfile(auth.getName());
    }

    @PutMapping("/profile")
    public ProfileResponse updateProfile(
            Authentication auth,
            @Valid @RequestBody UpdateProfileRequest req
    ) {
        return accountService.updateProfile(auth.getName(), req);
    }
}