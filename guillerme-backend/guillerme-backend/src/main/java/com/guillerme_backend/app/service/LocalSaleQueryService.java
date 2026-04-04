package com.guillerme_backend.app.service;

import com.guillerme_backend.app.api.admin.localsales.dto.LocalSaleDetailResponse;
import com.guillerme_backend.app.api.admin.localsales.dto.LocalSaleSummaryResponse;
import com.guillerme_backend.app.domain.localsale.LocalSale;
import com.guillerme_backend.app.domain.localsale.LocalSaleItemRepository;
import com.guillerme_backend.app.domain.localsale.LocalSaleRepository;
import com.guillerme_backend.app.exception.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class LocalSaleQueryService {

    private final LocalSaleRepository localSaleRepository;
    private final LocalSaleItemRepository localSaleItemRepository;

    public LocalSaleQueryService(
            LocalSaleRepository localSaleRepository,
            LocalSaleItemRepository localSaleItemRepository
    ) {
        this.localSaleRepository = localSaleRepository;
        this.localSaleItemRepository = localSaleItemRepository;
    }

    @Transactional(readOnly = true)
    public Page<LocalSaleSummaryResponse> list(
            String q,
            Instant from,
            Instant to,
            Pageable pageable
    ) {
        return localSaleRepository.adminSearch(q, from, to, pageable)
                .map(s -> LocalSaleSummaryResponse.of(
                        s.getId(),
                        s.getCreatedAt(),
                        s.getCreatedByEmail(),
                        s.getCustomerName(),
                        s.getTotalItems(),
                        s.getTotalAmount(),
                        s.getComment(),
                        s.getStatus() != null ? s.getStatus().name() : null
                ));
    }

    @Transactional(readOnly = true)
    public LocalSaleDetailResponse getDetail(Long id) {
        LocalSale s = localSaleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Venta local no encontrada"));

        var items = localSaleItemRepository.findBySaleId(id);

        LocalSaleDetailResponse d = new LocalSaleDetailResponse();
        d.id = s.getId();
        d.createdAt = s.getCreatedAt();
        d.createdByEmail = s.getCreatedByEmail();
        d.totalItems = s.getTotalItems();
        d.totalAmount = s.getTotalAmount();
        d.comment = s.getComment();
        d.customerName = s.getCustomerName();
        d.status = s.getStatus() != null ? s.getStatus().name() : null;

        d.items = items.stream().map(it -> {
            LocalSaleDetailResponse.Item x = new LocalSaleDetailResponse.Item();
            x.productId = it.getProductId();
            x.productNombre = it.getProductNombre();
            x.barcode = it.getBarcode();
            x.qty = it.getQty();
            x.unitPrice = it.getUnitPrice();
            x.subtotal = it.getSubtotal();
            return x;
        }).toList();

        return d;
    }
}