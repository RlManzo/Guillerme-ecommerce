package com.guillerme_backend.app.api.admin.products;

import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductUploadController {

    private static final Path UPLOAD_DIR = Paths.get("uploads"); // carpeta al lado del jar/proyecto

    @PostMapping("/image")
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        String ext = Optional.ofNullable(file.getOriginalFilename())
                .filter(n -> n.contains("."))
                .map(n -> n.substring(n.lastIndexOf(".")))
                .orElse(".jpg");

        String name = UUID.randomUUID() + ext;

        Path uploadsDir = Paths.get("uploads");
        Files.createDirectories(uploadsDir);

        Path dest = uploadsDir.resolve(name);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        return Map.of(
                "filename", name,
                "url", "/uploads/" + name
        );
    }

}
