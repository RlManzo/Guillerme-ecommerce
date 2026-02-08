package com.guillerme_backend.app.service;

import com.guillerme_backend.app.domain.cart.Cart;
import com.guillerme_backend.app.domain.cart.CartItem;
import com.guillerme_backend.app.domain.cart.CartRepository;
import com.guillerme_backend.app.domain.cart.CartStatus;
import com.guillerme_backend.app.domain.product.Product;
import com.guillerme_backend.app.domain.product.ProductRepository;
import com.guillerme_backend.app.domain.product.Stock;
import com.guillerme_backend.app.domain.product.StockRepository;
import com.guillerme_backend.app.domain.user.User;
import com.guillerme_backend.app.domain.user.UserRepository;
import com.guillerme_backend.app.exception.BadRequestException;
import com.guillerme_backend.app.exception.ConflictException;
import com.guillerme_backend.app.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final StockRepository stockRepository;
    private final UserRepository userRepository;

    public CartService(
            CartRepository cartRepository,
            ProductRepository productRepository,
            StockRepository stockRepository,
            UserRepository userRepository
    ) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.stockRepository = stockRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Cart getOrCreateActiveCart(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        return cartRepository.findByUserIdAndStatus(user.getId(), CartStatus.ACTIVE)
                .orElseGet(() -> {
                    Cart c = new Cart();
                    c.setUser(user);
                    c.setStatus(CartStatus.ACTIVE);
                    return cartRepository.save(c);
                });
    }

    @Transactional
    public Cart replaceCartItems(String email, List<AbstractMap.SimpleEntry<Long, Integer>> items) {
        Cart cart = getOrCreateActiveCart(email);

        // clear actual
        cart.getItems().clear();

        // add new (validando stock)
        for (var it : items) {
            Long productId = it.getKey();
            int qty = it.getValue() != null ? it.getValue() : 0;
            if (qty <= 0) continue;

            Product p = productRepository.findById(productId)
                    .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + productId));

            int available = stockRepository.findById(productId).map(Stock::getStock).orElse(0);
            if (qty > available) {
                throw new ConflictException("Sin stock para " + p.getNombre() + ". Max=" + available);
            }

            CartItem ci = new CartItem();
            ci.setCart(cart);
            ci.setProduct(p);
            ci.setQty(qty);
            cart.getItems().add(ci);
        }

        return cartRepository.save(cart);
    }

    @Transactional
    public Cart addItem(String email, Long productId, int qty) {
        if (qty <= 0) throw new BadRequestException("qty debe ser > 0");

        Cart cart = getOrCreateActiveCart(email);

        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Producto no encontrado"));

        int available = stockRepository.findById(productId).map(Stock::getStock).orElse(0);

        CartItem existing = cart.getItems().stream()
                .filter(x -> x.getProduct().getId().equals(productId))
                .findFirst()
                .orElse(null);

        int newQty = (existing != null ? existing.getQty() : 0) + qty;
        if (newQty > available) {
            throw new ConflictException("Sin stock. Max=" + available);
        }

        if (existing == null) {
            CartItem ci = new CartItem();
            ci.setCart(cart);
            ci.setProduct(p);
            ci.setQty(qty);
            cart.getItems().add(ci);
        } else {
            existing.setQty(newQty);
        }

        return cartRepository.save(cart);
    }

    @Transactional
    public Cart updateQty(String email, Long productId, int qty) {
        Cart cart = getOrCreateActiveCart(email);
        CartItem existing = cart.getItems().stream()
                .filter(x -> x.getProduct().getId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Item no encontrado en carrito"));

        if (qty <= 0) {
            cart.getItems().remove(existing);
            return cartRepository.save(cart);
        }

        int available = stockRepository.findById(productId).map(Stock::getStock).orElse(0);
        if (qty > available) throw new ConflictException("Sin stock. Max=" + available);

        existing.setQty(qty);
        return cartRepository.save(cart);
    }

    @Transactional
    public Cart removeItem(String email, Long productId) {
        Cart cart = getOrCreateActiveCart(email);
        cart.getItems().removeIf(x -> x.getProduct().getId().equals(productId));
        return cartRepository.save(cart);
    }
}
