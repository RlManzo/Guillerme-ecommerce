package com.guillerme_backend.app.service;

import com.guillerme_backend.app.api.admin.localsales.dto.CreateLocalSaleRequest;
import com.guillerme_backend.app.api.admin.localsales.dto.UpdateLocalSaleRequest;
import com.guillerme_backend.app.domain.localsale.*;
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
    private final LocalSaleItemRepository localSaleItemRepository;

    public LocalSaleService(
            LocalSaleRepository localSaleRepository,
            ProductRepository productRepository,
            StockRepository stockRepository,
            LocalSaleItemRepository localSaleItemRepository
    ) {
        this.localSaleRepository = localSaleRepository;
        this.productRepository = productRepository;
        this.stockRepository = stockRepository;
        this.localSaleItemRepository = localSaleItemRepository;
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
        sale.setComment(blankToNull(req.comment));
        sale.setStatus(LocalSaleStatus.FINALIZADA);

        return localSaleRepository.save(sale);
    }

    @Transactional
    public void cancelSale(Long id) {
        LocalSale sale = localSaleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Venta no encontrada"));

        if (sale.getStatus() == LocalSaleStatus.ANULADA) {
            throw new BadRequestException("La venta ya está anulada");
        }

        if (sale.getStatus() != LocalSaleStatus.FINALIZADA) {
            throw new BadRequestException("Solo se puede anular una venta finalizada");
        }

        var items = localSaleItemRepository.findBySaleId(id);

        for (var it : items) {
            Stock stock = stockRepository.findById(it.getProductId())
                    .orElseThrow(() -> new BadRequestException(
                            "No existe stock para el producto " + it.getProductNombre()
                    ));

            stock.setStock(stock.getStock() + it.getQty());
            stockRepository.save(stock);
        }

        sale.setStatus(LocalSaleStatus.ANULADA);
        localSaleRepository.save(sale);
    }

    @Transactional
    public void reopenSale(Long id) {
        LocalSale sale = localSaleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Venta no encontrada"));

        if (sale.getStatus() == LocalSaleStatus.ANULADA) {
            throw new BadRequestException("No se puede reabrir una venta anulada");
        }

        if (sale.getStatus() != LocalSaleStatus.FINALIZADA) {
            throw new BadRequestException("Solo se puede reabrir una venta finalizada");
        }

        var items = localSaleItemRepository.findBySaleId(id);

        for (var it : items) {
            Stock stock = stockRepository.findById(it.getProductId())
                    .orElseThrow(() -> new BadRequestException(
                            "No existe stock para el producto " + it.getProductNombre()
                    ));

            stock.setStock(stock.getStock() + it.getQty());
            stockRepository.save(stock);
        }

        sale.setStatus(LocalSaleStatus.ABIERTA);
        localSaleRepository.save(sale);
    }

    @Transactional
    public LocalSale finalizeOpenSale(Long id, UpdateLocalSaleRequest req) {
        LocalSale sale = localSaleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Venta no encontrada"));

        if (sale.getStatus() == LocalSaleStatus.ANULADA) {
            throw new BadRequestException("No se puede finalizar una venta anulada");
        }

        if (sale.getStatus() != LocalSaleStatus.ABIERTA) {
            throw new BadRequestException("Solo se puede finalizar una venta abierta");
        }

        if (req.items == null || req.items.isEmpty()) {
            throw new BadRequestException("La venta no puede quedar vacía");
        }

        // IMPORTANTE:
        // no reemplazar la colección ni borrar por repo si tenés orphanRemoval=true
        sale.getItems().clear();

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

            sale.getItems().add(item);

            totalItems += qty;
            totalAmount = totalAmount.add(subtotal);
        }

        sale.setTotalItems(totalItems);
        sale.setTotalAmount(totalAmount);
        sale.setCustomerName(blankToNull(req.customerName));
        sale.setComment(blankToNull(req.comment));
        sale.setStatus(LocalSaleStatus.FINALIZADA);

        return localSaleRepository.save(sale);
    }

    @Transactional
    public void closeOpenSale(Long id) {
        LocalSale sale = localSaleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Venta no encontrada"));

        if (sale.getStatus() == LocalSaleStatus.ANULADA) {
            throw new BadRequestException("No se puede cerrar una venta anulada");
        }

        if (sale.getStatus() != LocalSaleStatus.ABIERTA) {
            throw new BadRequestException("Solo se puede cerrar una venta abierta");
        }

        var items = localSaleItemRepository.findBySaleId(id);

        for (var it : items) {
            Stock stock = stockRepository.findById(it.getProductId())
                    .orElseThrow(() -> new BadRequestException(
                            "No existe stock para el producto " + it.getProductNombre()
                    ));

            if (stock.getStock() < it.getQty()) {
                throw new BadRequestException(
                        "No hay stock suficiente para restaurar la venta: " + it.getProductNombre()
                );
            }

            stock.setStock(stock.getStock() - it.getQty());
            stockRepository.save(stock);
        }

        sale.setStatus(LocalSaleStatus.FINALIZADA);
        localSaleRepository.save(sale);
    }

    private String blankToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}