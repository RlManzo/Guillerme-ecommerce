package com.guillerme_backend.app.api.products;

import com.guillerme_backend.app.api.products.dto.ProductResponse;
import com.guillerme_backend.app.service.ProductService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductResponse> list() {
        return productService.listAllActive().stream()
                .map(p -> ProductResponse.of(p, productService.getStock(p.getId())))
                .toList();
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable Long id) {
        var p = productService.getById(id);
        return ProductResponse.of(p, productService.getStock(id));
    }

    @GetMapping("/{id}/stock")
    public int stock(@PathVariable Long id) {
        return productService.getStock(id);
    }
}
