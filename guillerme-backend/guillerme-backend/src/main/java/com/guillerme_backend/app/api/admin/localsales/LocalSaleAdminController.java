package com.guillerme_backend.app.api.admin.localsales;

import com.guillerme_backend.app.api.admin.localsales.dto.CreateLocalSaleRequest;
import com.guillerme_backend.app.api.admin.localsales.dto.LocalSaleDetailResponse;
import com.guillerme_backend.app.api.admin.localsales.dto.LocalSaleSummaryResponse;
import com.guillerme_backend.app.api.admin.localsales.dto.UpdateLocalSaleRequest;
import com.guillerme_backend.app.service.LocalSaleQueryService;
import com.guillerme_backend.app.service.LocalSaleService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@PreAuthorize("hasAnyRole('ADMIN','OPERADOR')")
@RestController
@RequestMapping("/api/admin/local-sales")
public class LocalSaleAdminController {

    private final LocalSaleService localSaleService;
    private final LocalSaleQueryService localSaleQueryService;

    public LocalSaleAdminController(
            LocalSaleService localSaleService,
            LocalSaleQueryService localSaleQueryService
    ) {
        this.localSaleService = localSaleService;
        this.localSaleQueryService = localSaleQueryService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateResponse create(@Valid @RequestBody CreateLocalSaleRequest req, Authentication auth) {
        String email = auth != null ? auth.getName() : "admin";
        var sale = localSaleService.createSale(req, email);

        CreateResponse r = new CreateResponse();
        r.saleId = sale.getId();
        return r;
    }

    @PutMapping("/{id}")
    public CreateResponse finalizeOpenSale(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLocalSaleRequest req
    ) {
        var sale = localSaleService.finalizeOpenSale(id, req);

        CreateResponse r = new CreateResponse();
        r.saleId = sale.getId();
        return r;
    }

    @PatchMapping("/{id}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable Long id) {
        localSaleService.cancelSale(id);
    }

    @PatchMapping("/{id}/reopen")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reopen(@PathVariable Long id) {
        localSaleService.reopenSale(id);
    }

    @PatchMapping("/{id}/close")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void close(@PathVariable Long id) {
        localSaleService.closeOpenSale(id);
    }

    @GetMapping
    public Page<LocalSaleSummaryResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            Pageable pageable
    ) {
        return localSaleQueryService.list(q, from, to, pageable);
    }

    @GetMapping("/{id}")
    public LocalSaleDetailResponse getById(@PathVariable Long id) {
        return localSaleQueryService.getDetail(id);
    }

    public static class CreateResponse {
        public Long saleId;
    }
}