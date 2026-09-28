package com.guillerme_backend.app.service;

import com.guillerme_backend.app.api.admin.banners.BannerRequest;
import com.guillerme_backend.app.domain.banner.HomeBanner;
import com.guillerme_backend.app.domain.banner.HomeBannerRepository;
import com.guillerme_backend.app.domain.banner.HomeBannerType;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class HomeBannerService {
    private final HomeBannerRepository repository;

    public HomeBannerService(HomeBannerRepository repository) {
        this.repository = repository;
    }

    /** Carrusel público del home. */
    public List<HomeBanner> listPublic() {
        return repository.findAllByBannerTypeAndActiveTrueOrderBySortOrderAscIdAsc(HomeBannerType.CAROUSEL);
    }

    /** Popup público activo. Solo se utiliza uno. */
    public Optional<HomeBanner> getPublicPopup() {
        return repository.findFirstByBannerTypeAndActiveTrueOrderBySortOrderAscIdAsc(HomeBannerType.POPUP);
    }

    public List<HomeBanner> listAdmin() {
        return repository.findAllByOrderByBannerTypeAscSortOrderAscIdAsc();
    }

    @Transactional
    public HomeBanner create(BannerRequest request) {
        HomeBannerType type = request.bannerType() != null
                ? request.bannerType()
                : HomeBannerType.CAROUSEL;

        HomeBanner banner = new HomeBanner();
        banner.setImageUrl(request.imageUrl().trim());
        banner.setAltText(normalize(request.altText()));
        banner.setBannerType(type);
        banner.setTargetUrl(normalize(request.targetUrl()));
        banner.setSortOrder(request.sortOrder() != null ? request.sortOrder() : nextSortOrder(type));
        banner.setActive(request.active() == null || request.active());

        if (type == HomeBannerType.POPUP && banner.isActive()) {
            deactivateOtherPopups(null);
        }

        return repository.save(banner);
    }

    @Transactional
    public HomeBanner update(Long id, BannerRequest request) {
        HomeBanner banner = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Banner inexistente: " + id));

        HomeBannerType type = request.bannerType() != null
                ? request.bannerType()
                : banner.getBannerType();

        banner.setImageUrl(request.imageUrl().trim());
        banner.setAltText(normalize(request.altText()));
        banner.setBannerType(type);
        banner.setTargetUrl(normalize(request.targetUrl()));
        if (request.sortOrder() != null) banner.setSortOrder(request.sortOrder());
        if (request.active() != null) banner.setActive(request.active());
        banner.setUpdatedAt(Instant.now());

        if (type == HomeBannerType.POPUP && banner.isActive()) {
            deactivateOtherPopups(id);
        }

        return repository.save(banner);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Banner inexistente: " + id);
        }
        repository.deleteById(id);
    }

    @Transactional
    public void reorder(List<Long> ids) {
        for (int i = 0; i < ids.size(); i++) {
            final int index = i;
            final Long bannerId = ids.get(index);

            HomeBanner banner = repository.findById(bannerId)
                    .orElseThrow(() -> new IllegalArgumentException("Banner inexistente: " + bannerId));

            banner.setSortOrder(index);
            banner.setUpdatedAt(Instant.now());
            repository.save(banner);
        }
    }

    private int nextSortOrder(HomeBannerType type) {
        return repository.findAllByBannerTypeOrderBySortOrderAscIdAsc(type).stream()
                .mapToInt(HomeBanner::getSortOrder)
                .max()
                .orElse(-1) + 1;
    }

    private void deactivateOtherPopups(Long exceptId) {
        List<HomeBanner> activePopups =
                repository.findAllByBannerTypeAndActiveTrueOrderBySortOrderAscIdAsc(HomeBannerType.POPUP);

        for (HomeBanner current : activePopups) {
            if (exceptId != null && exceptId.equals(current.getId())) continue;
            current.setActive(false);
            current.setUpdatedAt(Instant.now());
            repository.save(current);
        }
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
