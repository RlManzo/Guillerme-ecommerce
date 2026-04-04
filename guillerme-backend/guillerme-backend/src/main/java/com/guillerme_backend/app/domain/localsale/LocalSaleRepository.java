package com.guillerme_backend.app.domain.localsale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocalSaleRepository extends JpaRepository<LocalSale, Long> {
    Page<LocalSale> findAllByOrderByCreatedAtDesc(Pageable pageable);
}