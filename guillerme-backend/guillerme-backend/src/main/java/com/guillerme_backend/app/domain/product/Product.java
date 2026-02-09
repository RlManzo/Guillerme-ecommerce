package com.guillerme_backend.app.domain.product;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "products")
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(name = "descripcion_corta", length = 400)
    private String descripcionCorta;

    @Column(name = "info_modal", columnDefinition = "text")
    private String infoModal;

    @Column(name = "img_url", columnDefinition = "text")
    private String imgUrl;

    // MVP simple: guardamos listas como texto (CSV/JSON string).
    @Column(columnDefinition = "text")
    private String categorias;

    @Column(columnDefinition = "text")
    private String servicios;

    @Column(columnDefinition = "text")
    private String keywords;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "precio", nullable = false, precision = 12, scale = 2)
    private BigDecimal precio = BigDecimal.ZERO;

    @Column(name = "img_url_2", columnDefinition = "text")
    private String imgUrl2;

    @Column(name = "img_url_3", columnDefinition = "text")
    private String imgUrl3;

    public String getImgUrl2() { return imgUrl2; }
    public void setImgUrl2(String imgUrl2) { this.imgUrl2 = imgUrl2; }

    public String getImgUrl3() { return imgUrl3; }
    public void setImgUrl3(String imgUrl3) { this.imgUrl3 = imgUrl3; }


    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }
    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcionCorta() { return descripcionCorta; }
    public void setDescripcionCorta(String descripcionCorta) { this.descripcionCorta = descripcionCorta; }
    public String getInfoModal() { return infoModal; }
    public void setInfoModal(String infoModal) { this.infoModal = infoModal; }
    public String getImgUrl() { return imgUrl; }
    public void setImgUrl(String imgUrl) { this.imgUrl = imgUrl; }
    public String getCategorias() { return categorias; }
    public void setCategorias(String categorias) { this.categorias = categorias; }
    public String getServicios() { return servicios; }
    public void setServicios(String servicios) { this.servicios = servicios; }
    public String getKeywords() { return keywords; }
    public void setKeywords(String keywords) { this.keywords = keywords; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
}
