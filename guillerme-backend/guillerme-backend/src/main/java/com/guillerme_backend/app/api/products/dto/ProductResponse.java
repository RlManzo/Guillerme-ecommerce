package com.guillerme_backend.app.api.products.dto;

import java.math.BigDecimal;

public class ProductResponse {
    public Long id;
    public String nombre;
    public String descripcionCorta;
    public String infoModal;
    public String imgUrl;
    public String imgUrl2;
    public String imgUrl3;

    public String categorias;
    public String servicios;
    public String keywords;
    public boolean activo;
    public int stock;
    public BigDecimal precio;

    public static ProductResponse of(
            com.guillerme_backend.app.domain.product.Product p,
            int stock
    ) {
        ProductResponse r = new ProductResponse();
        r.id = p.getId();
        r.nombre = p.getNombre();
        r.descripcionCorta = p.getDescripcionCorta();
        r.infoModal = p.getInfoModal();
        r.imgUrl = p.getImgUrl();
        r.imgUrl2 = p.getImgUrl2();
        r.imgUrl3 = p.getImgUrl3();
        r.categorias = p.getCategorias();
        r.servicios = p.getServicios();
        r.keywords = p.getKeywords();
        r.activo = p.isActivo();
        r.stock = stock;
        r.precio = p.getPrecio();

        return r;
    }
}
