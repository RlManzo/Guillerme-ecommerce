package com.guillerme_backend.app.domain.localsale;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "local_sales")
public class LocalSale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "created_by_email", length = 255)
    private String createdByEmail;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "total_items", nullable = false)
    private Integer totalItems = 0;

    @Column(name = "comment", columnDefinition = "text")
    private String comment;

    @Column(name = "customer_name", length = 255)
    private String customerName;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LocalSaleItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private LocalSaleStatus status = LocalSaleStatus.FINALIZADA;

    public LocalSaleStatus getStatus() { return status; }
    public void setStatus(LocalSaleStatus status) { this.status = status; }

    public Long getId() { return id; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getCreatedByEmail() { return createdByEmail; }
    public void setCreatedByEmail(String createdByEmail) { this.createdByEmail = createdByEmail; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public Integer getTotalItems() { return totalItems; }
    public void setTotalItems(Integer totalItems) { this.totalItems = totalItems; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public List<LocalSaleItem> getItems() { return items; }
    public void setItems(List<LocalSaleItem> items) { this.items = items; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
}