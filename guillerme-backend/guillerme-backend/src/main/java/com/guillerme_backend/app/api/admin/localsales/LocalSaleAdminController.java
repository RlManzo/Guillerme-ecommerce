package com.guillerme_backend.app.api.admin.localsales;

import com.guillerme_backend.app.api.admin.localsales.dto.CreateLocalSaleRequest;
import com.guillerme_backend.app.api.admin.localsales.dto.LocalSaleDetailResponse;
import com.guillerme_backend.app.api.admin.localsales.dto.LocalSaleSummaryResponse;
import com.guillerme_backend.app.api.products.dto.ProductResponse;
import com.guillerme_backend.app.service.LocalSaleQueryService;
import com.guillerme_backend.app.service.LocalSaleService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/local-sales")
public class LocalSaleAdminController {

    private final LocalSaleService localSaleService;

    private final LocalSaleQueryService localSaleQueryService;

    public LocalSaleAdminController(LocalSaleService localSaleService, LocalSaleQueryService localSaleQueryService) {
        this.localSaleService = localSaleService;
        this.localSaleQueryService = localSaleQueryService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Object create(@Valid @RequestBody CreateLocalSaleRequest req, Authentication auth) {
        String email = auth != null ? auth.getName() : "admin";
        var sale = localSaleService.createSale(req, email);

        return new Object() {
            public final Long saleId = sale.getId();
        };
    }

    @GetMapping
    public Page<LocalSaleSummaryResponse> list(Pageable pageable) {
        return localSaleQueryService.list(pageable);
    }

    @GetMapping("/{id}")
    public LocalSaleDetailResponse getById(@PathVariable Long id) {
        return localSaleQueryService.getDetail(id);
    }

    public static class CreateResponse {
        public Long saleId;
    }
}