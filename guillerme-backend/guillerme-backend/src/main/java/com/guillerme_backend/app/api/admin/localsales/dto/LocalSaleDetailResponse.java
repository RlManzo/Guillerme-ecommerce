package com.guillerme_backend.app.api.admin.localsales.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class LocalSaleDetailResponse {
    public Long id;
    public Instant createdAt;
    public String createdByEmail;
    public Integer totalItems;
    public BigDecimal totalAmount;
    public String comment;
    public List<Item> items;
    public String customerName;

    public static class Item {
        public Long productId;
        public String productNombre;
        public String barcode;
        public Integer qty;
        public BigDecimal unitPrice;
        public BigDecimal subtotal;
    }
}