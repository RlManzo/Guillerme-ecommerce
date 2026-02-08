package com.guillerme_backend.app.api.cart;

import com.guillerme_backend.app.api.cart.dto.*;
import com.guillerme_backend.app.domain.cart.Cart;
import com.guillerme_backend.app.service.CartService;
import com.guillerme_backend.app.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.AbstractMap;
import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final ProductService productService;

    public CartController(CartService cartService, ProductService productService) {
        this.cartService = cartService;
        this.productService = productService;
    }

    @GetMapping
    public CartResponse get(Authentication auth) {
        var cart = cartService.getOrCreateActiveCart(auth.getName());
        return toResponse(cart);
    }

    // Reemplaza carrito completo (ideal para merge desde Angular)
    @PutMapping
    public CartResponse replace(Authentication auth, @Valid @RequestBody CartReplaceRequest req) {
        List<AbstractMap.SimpleEntry<Long, Integer>> items = req.items.stream()
                .map(i -> new AbstractMap.SimpleEntry<>(i.productId, i.qty))
                .toList();

        Cart cart = cartService.replaceCartItems(auth.getName(), items);
        return toResponse(cart);
    }

    @PostMapping("/items")
    public CartResponse add(Authentication auth, @Valid @RequestBody AddItemRequest req) {
        var cart = cartService.addItem(auth.getName(), req.productId, req.qty);
        return toResponse(cart);
    }

    @PatchMapping("/items/{productId}")
    public CartResponse updateQty(Authentication auth, @PathVariable Long productId, @Valid @RequestBody UpdateQtyRequest req) {
        var cart = cartService.updateQty(auth.getName(), productId, req.qty);
        return toResponse(cart);
    }

    @DeleteMapping("/items/{productId}")
    public CartResponse remove(Authentication auth, @PathVariable Long productId) {
        var cart = cartService.removeItem(auth.getName(), productId);
        return toResponse(cart);
    }

    private CartResponse toResponse(Cart cart) {
        CartResponse r = new CartResponse();
        r.id = cart.getId();
        r.items = cart.getItems().stream()
                .map(it -> CartItemResponse.of(it, productService.getStock(it.getProduct().getId())))
                .toList();
        r.totalItems = r.items.stream().mapToInt(x -> x.qty).sum();
        return r;
    }
}
