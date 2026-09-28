package com.guillerme_backend.app.api.banners;

import com.guillerme_backend.app.service.HomeBannerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
public class BannerController {
    private final HomeBannerService service;

    public BannerController(HomeBannerService service) {
        this.service = service;
    }

    /** Mantiene el endpoint actual del carrusel. */
    @GetMapping
    public List<BannerResponse> list() {
        return service.listPublic().stream().map(BannerResponse::of).toList();
    }

    /** Popup que se muestra al ingresar al home. */
    @GetMapping("/popup")
    public ResponseEntity<BannerResponse> popup() {
        return service.getPublicPopup()
                .map(BannerResponse::of)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
