package com.guillerme_backend.app.api.admin.banners;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record BannerOrderRequest(@NotEmpty List<Long> ids) {}
