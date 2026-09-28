package com.guillerme_backend.app.api.admin.banners;

import com.guillerme_backend.app.api.banners.BannerResponse;
import com.guillerme_backend.app.service.HomeBannerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin/banners")
public class AdminBannerController {
    private final HomeBannerService service;

    public AdminBannerController(HomeBannerService service) {
        this.service = service;
    }

    @GetMapping
    public List<BannerResponse> list() {
        return service.listAdmin().stream().map(BannerResponse::of).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BannerResponse create(@Valid @RequestBody BannerRequest request) {
        return BannerResponse.of(service.create(request));
    }

    @PutMapping("/{id}")
    public BannerResponse update(@PathVariable Long id, @Valid @RequestBody BannerRequest request) {
        return BannerResponse.of(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PutMapping("/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(@Valid @RequestBody BannerOrderRequest request) {
        service.reorder(request.ids());
    }
}
