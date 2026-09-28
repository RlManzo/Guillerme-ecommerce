package com.guillerme_backend.app.api.admin.banners;

import com.guillerme_backend.app.domain.banner.HomeBannerType;
import jakarta.validation.constraints.NotBlank;

public record BannerRequest(
        @NotBlank String imageUrl,
        String altText,
        HomeBannerType bannerType,
        String targetUrl,
        Integer sortOrder,
        Boolean active
) {}
