package com.guillerme_backend.app.service;

import com.guillerme_backend.app.api.products.dto.CreateProductRequest;
import com.guillerme_backend.app.domain.product.Product;
import com.guillerme_backend.app.domain.product.ProductRepository;
import com.guillerme_backend.app.domain.product.Stock;
import com.guillerme_backend.app.domain.product.StockRepository;
import com.guillerme_backend.app.exception.BadRequestException;
import com.guillerme_backend.app.exception.NotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AdminProductService {

    private final ProductRepository productRepository;
    private final StockRepository stockRepository;

    public AdminProductService(ProductRepository productRepository, StockRepository stockRepository) {
        this.productRepository = productRepository;
        this.stockRepository = stockRepository;
    }

    @Transactional
    public List<Long> bulkCreate(List<CreateProductRequest> items) {
        List<Long> ids = new ArrayList<>();

        for (CreateProductRequest it : items) {
            String barcode = blankToNull(it.barcode);

            if (barcode != null && productRepository.existsByBarcode(barcode)) {
                throw new BadRequestException("Ya existe un producto con el código de barras: " + barcode);
            }

            Product p = new Product();
            p.setNombre(it.nombre);
            p.setDescripcionCorta(it.descripcionCorta);
            p.setInfoModal(it.infoModal);
            p.setImgUrl(it.imgUrl);
            p.setImgUrl2(it.imgUrl2);
            p.setImgUrl3(it.imgUrl3);
            p.setBarcode(barcode);
            p.setCategorias(it.categorias);
            p.setServicios(it.servicios);
            p.setKeywords(it.keywords);
            p.setActivo(it.activo == null ? true : it.activo);
            p.setPrecio(it.precio);
            p.setEstado(it.estado == null ? p.isEstado() : it.estado);

            Product saved = productRepository.save(p);
            ids.add(saved.getId());

            Long productId = saved.getId();

            Stock s = stockRepository.findById(productId).orElse(null);
            if (s == null) {
                s = new Stock();
                s.setProduct(saved);
            }

            int qty = (it.stock == null) ? 0 : it.stock;
            s.setStock(qty);
            stockRepository.save(s);
        }

        return ids;
    }

    @Transactional
    public void setStock(Long productId, int qty) {
        Stock s = stockRepository.findById(productId).orElse(null);
        if (s == null) {
            s = new Stock();
            Product pRef = productRepository.getReferenceById(productId);
            s.setProduct(pRef);
        }
        s.setStock(Math.max(0, qty));
        stockRepository.save(s);
    }

    @Transactional
    public Product update(Long id, CreateProductRequest it) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado id=" + id));

        String barcode = blankToNull(it.barcode);

        if (barcode != null && productRepository.existsByBarcodeAndIdNot(barcode, id)) {
            throw new BadRequestException("Ya existe otro producto con ese código de barras");
        }

        p.setNombre(it.nombre);
        p.setDescripcionCorta(it.descripcionCorta);
        p.setInfoModal(it.infoModal);
        p.setImgUrl(it.imgUrl);
        p.setImgUrl2(it.imgUrl2);
        p.setImgUrl3(it.imgUrl3);
        p.setBarcode(barcode);
        p.setCategorias(it.categorias);
        p.setServicios(it.servicios);
        p.setKeywords(it.keywords);
        p.setActivo(it.activo == null ? p.isActivo() : it.activo);
        p.setPrecio(it.precio == null ? p.getPrecio() : it.precio);
        p.setEstado(it.estado == null ? p.isEstado() : it.estado);

        Product saved = productRepository.save(p);

        int qty = (it.stock == null) ? 0 : it.stock;
        setStock(id, qty);

        return saved;
    }

    @Transactional
    public void delete(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado id=" + id));

        p.setActivo(false);
        productRepository.save(p);

        setStock(id, 0);
    }

    @Transactional
    public void setEstado(Long id, boolean estado) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado id=" + id));
        p.setEstado(estado);
        productRepository.save(p);
    }

    public Product getByBarcode(String barcode) {
        String code = normalizeBarcode(barcode);
        return productRepository.findByBarcode(code)
                .orElseThrow(() -> new NotFoundException("No existe un producto con ese código"));
    }

    private String blankToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private String normalizeBarcode(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    public List<Product> search(String q) {
        String term = q == null ? "" : q.trim();

        if (term.length() < 2) {
            return List.of();
        }

        return productRepository.searchForAdminSale(term, PageRequest.of(0, 10));
    }
}