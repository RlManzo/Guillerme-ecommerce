package com.guillerme_backend.app.service;

import com.guillerme_backend.app.api.admin.orders.dto.OrderAdminDetailResponse;
import com.guillerme_backend.app.api.admin.orders.dto.OrderAdminSummaryResponse;
import com.guillerme_backend.app.api.admin.orders.dto.RemoveOrderItemsRequest;
import com.guillerme_backend.app.domain.order.Order;
import com.guillerme_backend.app.domain.order.OrderItemRepository;
import com.guillerme_backend.app.domain.order.OrderRepository;
import com.guillerme_backend.app.domain.order.OrderStatus;
import com.guillerme_backend.app.exception.NotFoundException;
import com.guillerme_backend.app.domain.product.ProductRepository;
import com.guillerme_backend.app.domain.product.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Service
public class AdminOrdersService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository itemRepo;
    private final ProductRepository productRepo;
    private final AdminMailService mailService;

    public AdminOrdersService(
            OrderRepository orderRepo,
            OrderItemRepository itemRepo,
            ProductRepository productRepo, AdminMailService mailService1
    ) {
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.productRepo = productRepo;
        this.mailService = mailService1;
    }

    @Transactional(readOnly = true)
    public Page<OrderAdminSummaryResponse> search(String q, OrderStatus status, String from, String to, Pageable pageable) {

        OffsetDateTime fromDt = null;
        OffsetDateTime toDt = null;

        ZoneId zone = ZoneId.of("America/Argentina/Buenos_Aires");

        if (from != null && !from.isBlank()) {
            LocalDate d = LocalDate.parse(from);
            fromDt = d.atStartOfDay(zone).toOffsetDateTime();
        }

        if (to != null && !to.isBlank()) {
            LocalDate d = LocalDate.parse(to);
            toDt = d.plusDays(1).atStartOfDay(zone).toOffsetDateTime().minusNanos(1);
        }

        return orderRepo.adminSearch(q, status, fromDt, toDt, pageable)
                .map(r -> OrderAdminSummaryResponse.of(
                        r.getId(),
                        r.getCreatedAt(),
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

        var items = itemRepo.findByOrderId(o.getId());

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
            x.unitPrice = it.getUnitPrice();
            return x;
        }).toList();

        return d;
    }

    @Transactional
    public void updateStatus(Long id, OrderStatus newStatus) {
        Order o = orderRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Pedido no encontrado"));

        OrderStatus prev = o.getStatus();

        // ✅ Si transiciona a PAGADO: congelar precios unitarios en order_items
        if (newStatus == OrderStatus.PAGADO && prev != OrderStatus.PAGADO) {
            var items = itemRepo.findByOrderId(o.getId());

            for (var it : items) {
                if (it.getUnitPrice() == null) {
                    Product p = productRepo.findById(it.getProductId())
                            .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + it.getProductId()));

                    it.setUnitPrice(p.getPrecio());
                }
            }

            // si tu repo no persiste por dirty checking (depende cómo está mapeado),
            // podés forzar:
            itemRepo.saveAll(items);
        }

        o.setStatus(newStatus);
        orderRepo.save(o);
    }

    @Transactional
    public OrderAdminDetailResponse removeItems(Long orderId, RemoveOrderItemsRequest req) {
        Order o = orderRepo.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Pedido no encontrado"));

        if (o.getStatus() == OrderStatus.PAGADO || o.getStatus() == OrderStatus.ENVIADO) {
            throw new IllegalStateException("No se pueden eliminar productos de un pedido PAGADO o ENVIADO");
        }

        var items = itemRepo.findByOrderId(o.getId());

        if (items.isEmpty()) {
            throw new IllegalStateException("El pedido no tiene items");
        }

        var idsToKeep = new java.util.HashSet<>(req.productIdsToKeep);

        var toDelete = items.stream()
                .filter(it -> !idsToKeep.contains(it.getProductId()))
                .toList();

        if (toDelete.isEmpty()) {
            return getDetail(orderId);
        }

        if (toDelete.size() == items.size()) {
            throw new IllegalStateException("El pedido no puede quedar sin productos");
        }

        var removedProductNames = toDelete.stream()
                .map(it -> it.getProductNombre())
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        itemRepo.deleteAll(toDelete);

        String adminComment = (req.adminComment != null && !req.adminComment.isBlank())
                ? req.adminComment.trim()
                : "Pedido ajustado por falta de stock";

        String prev = (o.getComment() == null || o.getComment().isBlank())
                ? ""
                : o.getComment() + "\n";

        o.setComment(prev + "[ADMIN] " + adminComment);
        orderRepo.save(o);

        OrderAdminDetailResponse updated = getDetail(orderId);

        mailService.sendOrderAdjustedToCustomer(orderId, removedProductNames);


        return updated;
    }
}
