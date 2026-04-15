package com.guillerme_backend.app.service;

import com.guillerme_backend.app.api.orders.dto.CheckoutRequest;
import com.guillerme_backend.app.domain.customer.CustomerRepository;
import com.guillerme_backend.app.domain.order.*;
import com.guillerme_backend.app.domain.product.ProductRepository;
import com.guillerme_backend.app.domain.product.Stock;
import com.guillerme_backend.app.domain.product.StockRepository;
import com.guillerme_backend.app.domain.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    private final UserRepository userRepo;
    private final CustomerRepository customerRepo;
    private final ProductRepository productRepo;
    private final StockRepository stockRepo;
    private final OrderRepository orderRepo;
    private final OrderItemRepository itemRepo;
    private final AdminMailService adminMail;

    public OrderService(UserRepository userRepo, CustomerRepository customerRepo, ProductRepository productRepo, StockRepository stockRepo, OrderRepository orderRepo, OrderItemRepository itemRepo, AdminMailService adminMail) {
        this.userRepo = userRepo;
        this.customerRepo = customerRepo;
        this.productRepo = productRepo;
        this.stockRepo = stockRepo;
        this.orderRepo = orderRepo;
        this.itemRepo = itemRepo;
        this.adminMail = adminMail;
    }


    @Transactional
    public Long checkout(String email, CheckoutRequest req) {
        var user = userRepo.findByEmail(email).orElseThrow();
        var customer = customerRepo.findByUserId(user.getId()).orElseThrow();

        var items = req.items;
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Carrito vacío");
        }

        Order o = new Order();
        o.setUser(user);
        o.setStatus(OrderStatus.NUEVO);
        o.setCustomerEmail(user.getEmail());
        o.setCustomerNombre(customer.getNombre());
        o.setCustomerApellido(customer.getApellido());
        o.setCustomerTelefono(customer.getTelefono());
        o.setCustomerDireccion(customer.getDireccion());
        o.setComment(req.comment);
        o.setCustomerDocumento(customer.getDocumento());

        o = orderRepo.save(o);

        for (var it : items) {
            var p = productRepo.findById(it.productId)
                    .orElseThrow(() -> new IllegalArgumentException("Producto no existe: " + it.productId));

            var stockEntity = stockRepo.findById(p.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Stock no existe para: " + p.getNombre()));

            int stockActual = stockEntity.getStock();

            if (it.qty <= 0) {
                throw new IllegalArgumentException("Qty inválida");
            }

            if (stockActual < it.qty) {
                throw new IllegalArgumentException("Sin stock para: " + p.getNombre());
            }

            OrderItem oi = new OrderItem();
            oi.setOrder(o);
            oi.setProductId(p.getId());
            oi.setProductNombre(p.getNombre());
            oi.setQty(it.qty);
            oi.setImgUrl(p.getImgUrl());
            oi.setUnitPrice(p.getPrecio());
            itemRepo.save(oi);

            // ✅ descontar stock real
            stockEntity.setStock(stockActual - it.qty);
            stockRepo.save(stockEntity);
        }

        adminMail.sendNewOrderEmailToAdmin(o.getId());
        adminMail.sendOrderConfirmationToCustomer(o.getId());

        return o.getId();
    }
}
