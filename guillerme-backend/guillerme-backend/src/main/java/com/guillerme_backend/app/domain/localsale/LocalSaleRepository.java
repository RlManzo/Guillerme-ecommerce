package com.guillerme_backend.app.domain.localsale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface LocalSaleRepository extends JpaRepository<LocalSale, Long> {
    Page<LocalSale> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("""
select s
from LocalSale s
where (
    :q is null or :q = ''
    or lower(coalesce(s.customerName, '')) like lower(concat('%', :q, '%'))
    or lower(coalesce(s.createdByEmail, '')) like lower(concat('%', :q, '%'))
    or cast(s.id as string) = :q
)
and (
    cast(:from as timestamp) is null or s.createdAt >= :from
)
and (
    cast(:to as timestamp) is null or s.createdAt <= :to
)
order by s.createdAt desc
""")
    Page<LocalSale> adminSearch(
            @Param("q") String q,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable
    );
}