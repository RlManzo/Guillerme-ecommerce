package com.guillerme_backend.app.api.admin.localsales.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class LocalSaleSummaryResponse {
    public Long id;
    public Instant createdAt;
    public String createdByEmail;
    public String customerName;
    public Integer totalItems;
    public BigDecimal totalAmount;
    public String comment;

    public static LocalSaleSummaryResponse of(
            Long id,
            Instant createdAt,
            String createdByEmail,
            String customerName,
            Integer totalItems,
            BigDecimal totalAmount,
            String comment
    ) {
        LocalSaleSummaryResponse r = new LocalSaleSummaryResponse();
        r.id = id;
        r.createdAt = createdAt;
        r.createdByEmail = createdByEmail;
        r.customerName = customerName;
        r.totalItems = totalItems;
        r.totalAmount = totalAmount;
        r.comment = comment;
        return r;
    }
}