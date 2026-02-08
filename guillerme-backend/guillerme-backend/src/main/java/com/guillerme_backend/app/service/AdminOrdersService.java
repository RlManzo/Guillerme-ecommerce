package com.guillerme_backend.app.service;

import com.guillerme_backend.app.api.admin.orders.dto.OrderAdminDetailResponse;
import com.guillerme_backend.app.api.admin.orders.dto.OrderAdminSummaryResponse;
import com.guillerme_backend.app.domain.order.Order;
import com.guillerme_backend.app.domain.order.OrderItemRepository;
import com.guillerme_backend.app.domain.order.OrderRepository;
import com.guillerme_backend.app.domain.order.OrderStatus;
import com.guillerme_backend.app.exception.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Service
public class AdminOrdersService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository itemRepo;

    public AdminOrdersService(OrderRepository orderRepo, OrderItemRepository itemRepo) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
    }

    @Transactional(readOnly = true)
    public Page<OrderAdminSummaryResponse> search(String q, OrderStatus status, String from, String to, Pageable pageable) {

        OffsetDateTime fromDt = null;
        OffsetDateTime toDt = null;

        ZoneId zone = ZoneId.of("America/Argentina/Buenos_Aires");

        if (from != null && !from.isBlank()) {
            LocalDate d = LocalDate.parse(from);              // YYYY-MM-DD
            fromDt = d.atStartOfDay(zone).toOffsetDateTime(); // 00:00
        }

        if (to != null && !to.isBlank()) {
            LocalDate d = LocalDate.parse(to);
            toDt = d.plusDays(1).atStartOfDay(zone).toOffsetDateTime().minusNanos(1); // 23:59:59.999999999
        }

        return orderRepo.adminSearch(q, status, fromDt, toDt, pageable)
                .map(r -> OrderAdminSummaryResponse.of(
                        r.getId(),
                        r.getCreatedAt(), // ojo tipo!
                        r.getStatus(),
                        r.getCustomerEmail(),
                        r.getCustomerNombre(),
                        r.getCustomerApellido(),
                        r.getTotalItems()
                ));
    }


    @Transactional(readOnly = true)
    public OrderAdminDetailResponse getDetail(Long id) {
        Order o = orderRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Pedido no encontrado"));

        var items = itemRepo.findByOrderId(o.getId()); // (creamos este método abajo)

        OrderAdminDetailResponse d = new OrderAdminDetailResponse();
        d.id = o.getId();
        d.createdAt = o.getCreatedAt();
        d.status = o.getStatus();

        d.customerEmail = o.getCustomerEmail();
        d.customerNombre = o.getCustomerNombre();
        d.customerApellido = o.getCustomerApellido();
        d.customerTelefono = o.getCustomerTelefono();
        d.customerDireccion = o.getCustomerDireccion();

        d.comment = o.getComment();

        d.items = items.stream().map(it -> {
            OrderAdminDetailResponse.Item x = new OrderAdminDetailResponse.Item();
            x.productId = it.getProductId();
            x.productNombre = it.getProductNombre();
            x.qty = it.getQty();
            x.imgUrl = it.getImgUrl();
            return x;
        }).toList();

        return d;
    }

    @Transactional
    public void updateStatus(Long id, OrderStatus newStatus) {
        Order o = orderRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Pedido no encontrado"));

        o.setStatus(newStatus);
        orderRepo.save(o);
    }
}
