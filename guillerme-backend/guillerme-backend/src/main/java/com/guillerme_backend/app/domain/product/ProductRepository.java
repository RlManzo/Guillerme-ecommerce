package com.guillerme_backend.app.domain.product;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findAllByActivoTrueAndEstadoTrue();
    Optional<Product> findByBarcode(String barcode);
    boolean existsByBarcode(String barcode);
    boolean existsByBarcodeAndIdNot(String barcode, Long id);

    @Query("""
    select p
    from Product p
    where
        lower(p.nombre) like lower(concat('%', :q, '%'))
        or lower(coalesce(p.barcode, '')) like lower(concat('%', :q, '%'))
        or lower(coalesce(p.keywords, '')) like lower(concat('%', :q, '%'))
        or lower(coalesce(p.categorias, '')) like lower(concat('%', :q, '%'))
    order by p.nombre asc
""")
    List<Product> searchForAdminSale(@Param("q") String q, Pageable pageable);

}