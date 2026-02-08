package com.guillerme_backend.app.api.cart.dto;

public class CartItemResponse {
    public Long productId;
    public String nombre;
    public String imgUrl;
    public int qty;
    public int stock;

    public static CartItemResponse of(
            com.guillerme_backend.app.domain.cart.CartItem it,
            int stock
    ) {
        CartItemResponse r = new CartItemResponse();
        r.productId = it.getProduct().getId();
        r.nombre = it.getProduct().getNombre();
        r.imgUrl = it.getProduct().getImgUrl();
        r.qty = it.getQty();
        r.stock = stock;
        return r;
    }
}
