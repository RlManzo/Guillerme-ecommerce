package com.guillerme_backend.app.api.admin.banners;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin/banners")
public class AdminBannerUploadController {
    private static final Path UPLOAD_DIR = Paths.get("/uploads/banners");
    private static final Set<String> ALLOWED_EXT = Set.of(".jpg", ".jpeg", ".png", ".webp");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_IMAGE_BYTES = 12L * 1024 * 1024;

    @PostMapping("/image")
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Archivo vacío");
        }

        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(n -> n.contains("."))
                .map(n -> n.substring(n.lastIndexOf('.')))
                .map(String::toLowerCase)
                .orElse("");

        if (!ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("Extensión no permitida: " + ext);
        }

        String contentType = Optional.ofNullable(file.getContentType()).orElse("");
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Tipo de contenido no permitido: " + contentType);
        }

        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("La imagen supera el máximo permitido de 12MB");
        }

        Files.createDirectories(UPLOAD_DIR);
        String name = UUID.randomUUID() + ext;
        Path destination = UPLOAD_DIR.resolve(name).normalize();
        if (!destination.startsWith(UPLOAD_DIR)) {
            throw new IllegalArgumentException("Ruta de destino inválida");
        }
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        return Map.of(
                "filename", name,
                "url", "/uploads/banners/" + name
        );
    }
}
