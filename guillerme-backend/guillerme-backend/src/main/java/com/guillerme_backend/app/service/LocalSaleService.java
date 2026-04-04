package com.guillerme_backend.app.service;

import com.guillerme_backend.app.api.admin.localsales.dto.CreateLocalSaleRequest;
import com.guillerme_backend.app.domain.localsale.LocalSale;
import com.guillerme_backend.app.domain.localsale.LocalSaleItem;
import com.guillerme_backend.app.domain.localsale.LocalSaleRepository;
import com.guillerme_backend.app.domain.product.Product;
import com.guillerme_backend.app.domain.product.ProductRepository;
import com.guillerme_backend.app.domain.product.Stock;
import com.guillerme_backend.app.domain.product.StockRepository;
import com.guillerme_backend.app.exception.BadRequestException;
import com.guillerme_backend.app.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;

@Service
public class LocalSaleService {

    private final LocalSaleRepository localSaleRepository;
    private final ProductRepository productRepository;
    private final StockRepository stockRepository;

    public LocalSaleService(
            LocalSaleRepository localSaleRepository,
            ProductRepository productRepository,
            StockRepository stockRepository
    ) {
        this.localSaleRepository = localSaleRepository;
        this.productRepository = productRepository;
        this.stockRepository = stockRepository;
    }

    @Transactional
    public LocalSale createSale(CreateLocalSaleRequest req, String adminEmail) {
        if (req.items == null || req.items.isEmpty()) {
            throw new BadRequestException("La compra no puede quedar vacía");
        }

        LocalSale sale = new LocalSale();
        sale.setCreatedByEmail(adminEmail);
        sale.setComment(req.comment);

        var savedItems = new ArrayList<LocalSaleItem>();
        int totalItems = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (var it : req.items) {
            Product p = productRepository.findById(it.productId)
                    .orElseThrow(() -> new NotFoundException("Producto no encontrado: " + it.productId));

            Stock stock = stockRepository.findById(it.productId)
                    .orElseThrow(() -> new BadRequestException("No existe stock para el producto: " + p.getNombre()));

            int qty = it.qty == null ? 0 : it.qty;
            if (qty <= 0) {
                throw new BadRequestException("Cantidad inválida para: " + p.getNombre());
            }

            if (stock.getStock() < qty) {
                throw new BadRequestException("Stock insuficiente para: " + p.getNombre());
            }

            BigDecimal unitPrice = p.getPrecio() == null ? BigDecimal.ZERO : p.getPrecio();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(qty));

            stock.setStock(stock.getStock() - qty);
            stockRepository.save(stock);

            LocalSaleItem item = new LocalSaleItem();
            item.setSale(sale);
            item.setProductId(p.getId());
            item.setProductNombre(p.getNombre());
            item.setBarcode(p.getBarcode());
            item.setQty(qty);
            item.setUnitPrice(unitPrice);
            item.setSubtotal(subtotal);

            savedItems.add(item);

            totalItems += qty;
            totalAmount = totalAmount.add(subtotal);
        }

        sale.setItems(savedItems);
        sale.setTotalItems(totalItems);
        sale.setTotalAmount(totalAmount);
        sale.setCustomerName(blankToNull(req.customerName));

        return localSaleRepository.save(sale);
    }

    private String blankToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}