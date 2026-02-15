package com.guillerme_backend.app.service;


import com.guillerme_backend.app.api.products.dto.CreateProductRequest;
import com.guillerme_backend.app.domain.product.Product;
import com.guillerme_backend.app.domain.product.ProductRepository;
import com.guillerme_backend.app.domain.product.Stock;
import com.guillerme_backend.app.domain.product.StockRepository;
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
            // 1) crear producto
            Product p = new Product();
            p.setNombre(it.nombre);
            p.setDescripcionCorta(it.descripcionCorta);
            p.setInfoModal(it.infoModal);
            p.setImgUrl(it.imgUrl);
            p.setImgUrl2(it.imgUrl2);
            p.setImgUrl3(it.imgUrl3);
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
            // suponiendo que Stock tiene relación @MapsId o FK a Product
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

        p.setNombre(it.nombre);
        p.setDescripcionCorta(it.descripcionCorta);
        p.setInfoModal(it.infoModal);
        p.setImgUrl(it.imgUrl);
        p.setImgUrl2(it.imgUrl2);
        p.setImgUrl3(it.imgUrl3);
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
        // recomendado: borrado lógico
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado id=" + id));

        p.setActivo(false);
        productRepository.save(p);

        // opcional: poner stock en 0 para que no aparezca como disponible
        setStock(id, 0);

        // si quisieras borrado físico:
        // stockRepository.deleteById(id);
        // productRepository.deleteById(id);
    }

    @Transactional
    public void setEstado(Long id, boolean estado) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado id=" + id));
        p.setEstado(estado);
        productRepository.save(p);
    }


}
