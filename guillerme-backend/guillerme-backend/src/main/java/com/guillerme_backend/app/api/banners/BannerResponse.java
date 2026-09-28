package com.guillerme_backend.app.api.banners;

import com.guillerme_backend.app.domain.banner.HomeBannerType;
import com.guillerme_backend.app.domain.banner.HomeBanner;

public record BannerResponse(
        Long id,
        String imageUrl,
        String altText,
        HomeBannerType bannerType,
        String targetUrl,
        int sortOrder,
        boolean active
) {
    public static BannerResponse of(HomeBanner banner) {
        return new BannerResponse(
                banner.getId(),
                banner.getImageUrl(),
                banner.getAltText(),
                banner.getBannerType(),
                banner.getTargetUrl(),
                banner.getSortOrder(),
                banner.isActive()
        );
    }
}
