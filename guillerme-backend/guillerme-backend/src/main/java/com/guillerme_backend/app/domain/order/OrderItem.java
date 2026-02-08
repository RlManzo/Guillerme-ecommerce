package com.guillerme_backend.app.domain.order;

import jakarta.persistence.*;

@Entity
@Table(name = "order_items",
        indexes = {
                @Index(name = "ix_order_items_order_id", columnList = "order_id")
        })
public class OrderItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // referencias/snapshot producto (sin FK estricta si querés libertad)
    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_nombre", nullable = false, length = 200)
    private String productNombre;

    @Column(name = "img_url", columnDefinition = "text")
    private String imgUrl;

    @Column(nullable = false)
    private int qty;

    // --- getters/setters ---
    public Long getId() { return id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductNombre() { return productNombre; }
    public void setProductNombre(String productNombre) { this.productNombre = productNombre; }

    public String getImgUrl() { return imgUrl; }
    public void setImgUrl(String imgUrl) { this.imgUrl = imgUrl; }

    public int getQty() { return qty; }
    public void setQty(int qty) { this.qty = qty; }
}
