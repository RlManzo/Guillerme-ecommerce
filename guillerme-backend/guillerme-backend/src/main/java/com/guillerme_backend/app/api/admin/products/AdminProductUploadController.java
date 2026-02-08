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

    // Opcional: whitelist simple de extensiones
    private static final Set<String> ALLOWED_EXT = Set.of(".jpg", ".jpeg", ".png", ".webp");

    @PostMapping("/image")
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {

        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(n -> n.contains("."))
                .map(n -> n.substring(n.lastIndexOf(".")))
                .map(String::toLowerCase)
                .orElse(".jpg");

        if (!ALLOWED_EXT.contains(ext)) {
            // si preferís no bloquear, podés forzar ".jpg" en vez de tirar error
            throw new IllegalArgumentException("Extensión no permitida: " + ext);
        }

        String name = UUID.randomUUID() + ext;

        Files.createDirectories(UPLOAD_DIR);

        Path dest = UPLOAD_DIR.resolve(name).normalize();

        // Seguridad: evita path traversal (por las dudas)
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
