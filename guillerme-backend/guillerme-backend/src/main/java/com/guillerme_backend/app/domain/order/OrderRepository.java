package com.guillerme_backend.app.domain.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    List<Order> findAllByStatusOrderByCreatedAtDesc(OrderStatus status);
    List<Order> findAllByCustomerEmailOrderByCreatedAtDesc(String customerEmail);
    Optional<Order> findByIdAndCustomerEmail(Long id, String customerEmail);


    interface OrderAdminRow {
        Long getId();
        Instant getCreatedAt();
        OrderStatus getStatus();
        String getCustomerEmail();
        String getCustomerNombre();
        String getCustomerApellido();
        Integer getTotalItems();
    }

    @Query("""
select
  o.id as id,
  o.createdAt as createdAt,
  o.status as status,
  o.customerEmail as customerEmail,
  o.customerNombre as customerNombre,
  o.customerApellido as customerApellido,
  (select coalesce(sum(i.qty), 0) from OrderItem i where i.order.id = o.id) as totalItems
from Order o
where (:q is null or :q = ''
       or lower(o.customerEmail) like lower(concat('%', :q, '%'))
       or cast(o.id as string) = :q)
  and (:status is null or o.status = :status)
  and o.createdAt >= coalesce(:fromDt, o.createdAt)
  and o.createdAt <= coalesce(:toDt,   o.createdAt)
order by o.createdAt desc
""")
    Page<OrderAdminRow> adminSearch(
            @Param("q") String q,
            @Param("status") OrderStatus status,
            @Param("fromDt") OffsetDateTime fromDt,
            @Param("toDt") OffsetDateTime toDt,
            Pageable pageable
    );

}
