package com.guillerme_backend.app.domain.product;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "stock")
public class Stock {
    @Id
    @Column(name = "product_id")
    private Long productId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private int stock = 0;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Long getProductId() { return productId; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }
}
