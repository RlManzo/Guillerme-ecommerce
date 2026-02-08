package com.guillerme_backend.app.service;

import com.guillerme_backend.app.api.orders.dto.*;
import com.guillerme_backend.app.domain.order.*;
import com.guillerme_backend.app.exception.NotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrdersQueryService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository itemRepo;

    public OrdersQueryService(OrderRepository orderRepo, OrderItemRepository itemRepo) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
    }

    public List<OrderSummaryResponse> myOrders(String email) {
        return orderRepo.findAllByCustomerEmailOrderByCreatedAtDesc(email).stream()
                .map(o -> new OrderSummaryResponse(
                        o.getId(),
                        o.getCreatedAt(),
                        itemRepo.findAllByOrderId(o.getId()).stream().mapToInt(OrderItem::getQty).sum(),
                        (o.getStatus() != null) ? o.getStatus().name() : "CREATED",
                        o.getComment()
                ))
                .toList();
    }

    public OrderDetailResponse myOrderDetail(String email, Long id) {
        var o = orderRepo.findByIdAndCustomerEmail(id, email)
                .orElseThrow(() -> new NotFoundException("Pedido no encontrado"));

        var items = itemRepo.findAllByOrderId(id).stream()
                .map(it -> new OrderItemResponse(it.getProductId(), it.getProductNombre(), it.getQty()))
                .toList();

        return new OrderDetailResponse(
                o.getId(), o.getCreatedAt(),
                o.getCustomerNombre(), o.getCustomerApellido(), o.getCustomerEmail(),
                o.getCustomerTelefono(), o.getCustomerDireccion(),
                o.getComment(),
                items
        );
    }
}
