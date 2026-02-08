package com.guillerme_backend.app.service;

import com.guillerme_backend.app.api.products.dto.CreateProductRequest;
import com.guillerme_backend.app.domain.product.Product;
import com.guillerme_backend.app.domain.product.ProductRepository;
import com.guillerme_backend.app.domain.product.Stock;
import com.guillerme_backend.app.domain.product.StockRepository;
import com.guillerme_backend.app.exception.NotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final StockRepository stockRepository;

    public ProductService(ProductRepository productRepository, StockRepository stockRepository) {
        this.productRepository = productRepository;
        this.stockRepository = stockRepository;
    }

    public List<Product> listAllActive() {
        // MVP: sin filtro, o podés agregar query method por activo=true
        return productRepository.findAll().stream().filter(Product::isActivo).toList();
    }

    public Product getById(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new NotFoundException("Producto no encontrado"));
    }

    public int getStock(Long productId) {
        return stockRepository.findById(productId).map(Stock::getStock).orElse(0);
    }

    public Product create(CreateProductRequest req) {
        Product p = new Product();
        p.setNombre(req.nombre.trim());
        p.setDescripcionCorta(blankToNull(req.descripcionCorta));
        p.setInfoModal(blankToNull(req.infoModal));
        p.setImgUrl(blankToNull(req.imgUrl));
        p.setCategorias(blankToNull(req.categorias));
        p.setServicios(blankToNull(req.servicios));
        p.setKeywords(blankToNull(req.keywords));
        p.setPrecio(req.precio == null ? BigDecimal.ZERO : req.precio);
        if (req.activo != null) p.setActivo(req.activo);

        // 1) guardar producto
        p = productRepository.save(p);

        // 2) guardar stock asociado (1 a 1 con mapsId)
        Stock s = new Stock();
        s.setProduct(p);
        s.setStock(req.stock == null ? 0 : req.stock);
        stockRepository.save(s);

        return p;
    }

    private String blankToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
