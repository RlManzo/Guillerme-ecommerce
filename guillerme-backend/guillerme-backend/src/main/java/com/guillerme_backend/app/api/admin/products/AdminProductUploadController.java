package com.guillerme_backend.app.api.admin.products;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductUploadController {

    // IMPORTANTE: en Docker esto debe ser ABSOLUTO para que caiga en el volumen (uploads:/uploads)
    private static final Path UPLOAD_DIR = Paths.get("/uploads");

    // ✅ extensiones permitidas (imagen + video)
    private static final Set<String> ALLOWED_EXT = Set.of(
            ".jpg", ".jpeg", ".png", ".webp",
            ".mp4", ".webm", ".mov"
    );

    // ✅ content-types permitidos (más seguro que solo extensión)
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp",
            "video/mp4", "video/webm", "video/quicktime" // mov = quicktime
    );

    // ✅ límites (MVP)
    private static final long MAX_IMAGE_BYTES = 8L * 1024 * 1024;   // 8MB
    private static final long MAX_VIDEO_BYTES = 50L * 1024 * 1024;  // 50MB

    @PostMapping("/image") // 👈 mantenemos la ruta para no cambiar el FE
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {

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

        // tamaño máximo por tipo
        long size = file.getSize();
        boolean isVideo = ct.startsWith("video/") || ext.equals(".mp4") || ext.equals(".webm") || ext.equals(".mov");
        long max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

        if (size > max) {
            throw new IllegalArgumentException("Archivo supera el máximo permitido: " + (max / (1024 * 1024)) + "MB");
        }

        String name = UUID.randomUUID() + ext;

        Files.createDirectories(UPLOAD_DIR);

        Path dest = UPLOAD_DIR.resolve(name).normalize();

        // Seguridad: evita path traversal
        if (!dest.startsWith(UPLOAD_DIR)) {
            throw new IllegalArgumentException("Ruta de destino inválida");
        }

        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        return Map.of(
                "filename", name,
                "url", "/uploads/" + name
        );
    }
}
