package com.guillerme_backend.app.domain.localsale;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LocalSaleItemRepository extends JpaRepository<LocalSaleItem, Long> {
    List<LocalSaleItem> findBySaleId(Long saleId);
}