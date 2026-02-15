package com.guillerme_backend.app.api.admin.products;

import com.guillerme_backend.app.api.products.dto.BulkProductCreateRequest;
import com.guillerme_backend.app.api.products.dto.BulkProductCreateResponse;
import com.guillerme_backend.app.api.products.dto.CreateProductRequest;
import com.guillerme_backend.app.api.products.dto.ProductResponse;
import com.guillerme_backend.app.service.AdminOrderShippingService;
import com.guillerme_backend.app.service.AdminProductService;
import com.guillerme_backend.app.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
public class ProductAdminController {

    private final ProductService productService;
    private final AdminProductService adminProductService;

    public ProductAdminController(ProductService productService, AdminProductService adminProductService, AdminOrderShippingService adminOrderShippingService) {
        this.productService = productService;
        this.adminProductService = adminProductService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody CreateProductRequest req) {

        var ids = adminProductService.bulkCreate(List.of(req));
        Long id = ids.get(0);

        var p = productService.getById(id);
        return ProductResponse.of(p, productService.getStock(id));
    }

    @PostMapping("/bulk")
    public BulkProductCreateResponse bulkCreate(@Valid @RequestBody BulkProductCreateRequest req) {
        var ids = adminProductService.bulkCreate(req.items);
        return BulkProductCreateResponse.of(ids);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id, @Valid @RequestBody CreateProductRequest req) {
        var p = adminProductService.update(id, req);
        return ProductResponse.of(p, productService.getStock(id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        adminProductService.delete(id);
    }


}

