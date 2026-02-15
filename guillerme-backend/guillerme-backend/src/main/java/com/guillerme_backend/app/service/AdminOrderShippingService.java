package com.guillerme_backend.app.service;

import com.guillerme_backend.app.domain.order.Order;
import com.guillerme_backend.app.domain.order.OrderRepository;
import com.guillerme_backend.app.domain.order.OrderStatus;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class AdminOrderShippingService {

    // igual que productos: absoluto para Docker volumen uploads:/uploads
    private static final Path UPLOAD_DIR = Paths.get("/uploads");

    private static final Set<String> ALLOWED_EXT = Set.of(".pdf", ".jpg", ".jpeg", ".png");

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png"
    );

    private static final long MAX_BYTES = 8L * 1024 * 1024; // 8MB

    private final OrderRepository orderRepo;
    private final AdminMailService adminMail;

    public AdminOrderShippingService(OrderRepository orderRepo, AdminMailService adminMail) {
        this.orderRepo = orderRepo;
        this.adminMail = adminMail;
    }

    @Transactional
    public void markAsShipped(Long orderId, String tracking, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Archivo vacío");
        }

        // extensión
        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(n -> n.contains("."))
                .map(n -> n.substring(n.lastIndexOf(".")))
                .map(String::toLowerCase)
                .orElse("");

        if (!ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("Extensión no permitida: " + ext);
        }

        // content-type
        String ct = Optional.ofNullable(file.getContentType()).orElse("");
        if (!ALLOWED_CONTENT_TYPES.contains(ct)) {
            throw new IllegalArgumentException("Tipo de contenido no permitido: " + ct);
        }

        // tamaño
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Archivo supera el máximo permitido: " + (MAX_BYTES / (1024 * 1024)) + "MB");
        }

        // guardar archivo
        String name = UUID.randomUUID() + ext;

        try {
            Files.createDirectories(UPLOAD_DIR);

            Path dest = UPLOAD_DIR.resolve(name).normalize();
            if (!dest.startsWith(UPLOAD_DIR)) {
                throw new IllegalArgumentException("Ruta de destino inválida");
            }

            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo guardar el archivo", e);
        }

        // actualizar order
        Order o = orderRepo.findById(orderId).orElseThrow();

        o.setStatus(OrderStatus.ENVIADO);

        String tr = tracking == null ? null : tracking.trim();
        o.setShipmentTracking((tr == null || tr.isBlank()) ? null : tr);

        o.setShipmentFileName(name);
        o.setShipmentFileUrl("/uploads/" + name);

        orderRepo.save(o);

        // enviar mail con adjunto desde /uploads
        adminMail.sendOrderShippedToCustomer(o.getId());
    }
}
