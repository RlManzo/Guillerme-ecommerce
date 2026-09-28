package com.guillerme_backend.app.domain.banner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HomeBannerRepository extends JpaRepository<HomeBanner, Long> {
    List<HomeBanner> findAllByBannerTypeAndActiveTrueOrderBySortOrderAscIdAsc(HomeBannerType bannerType);
    List<HomeBanner> findAllByBannerTypeOrderBySortOrderAscIdAsc(HomeBannerType bannerType);
    List<HomeBanner> findAllByOrderByBannerTypeAscSortOrderAscIdAsc();
    Optional<HomeBanner> findFirstByBannerTypeAndActiveTrueOrderBySortOrderAscIdAsc(HomeBannerType bannerType);
}
