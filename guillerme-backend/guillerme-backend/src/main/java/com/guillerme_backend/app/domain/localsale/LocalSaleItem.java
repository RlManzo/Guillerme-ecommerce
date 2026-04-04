package com.guillerme_backend.app.domain.localsale;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "local_sale_items")
public class LocalSaleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private com.guillerme_backend.app.domain.localsale.LocalSale sale;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_nombre", nullable = false, length = 255)
    private String productNombre;

    @Column(name = "barcode", length = 64)
    private String barcode;

    @Column(name = "qty", nullable = false)
    private Integer qty;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    public Long getId() { return id; }

    public com.guillerme_backend.app.domain.localsale.LocalSale getSale() { return sale; }
    public void setSale(LocalSale sale) { this.sale = sale; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductNombre() { return productNombre; }
    public void setProductNombre(String productNombre) { this.productNombre = productNombre; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public Integer getQty() { return qty; }
    public void setQty(Integer qty) { this.qty = qty; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
}