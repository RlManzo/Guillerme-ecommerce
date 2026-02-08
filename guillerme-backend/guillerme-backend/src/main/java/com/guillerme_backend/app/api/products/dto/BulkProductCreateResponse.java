package com.guillerme_backend.app.api.products.dto;

import java.util.ArrayList;
import java.util.List;

public class BulkProductCreateResponse {
    public int created;
    public List<Long> ids = new ArrayList<>();

    public static BulkProductCreateResponse of(List<Long> ids) {
        BulkProductCreateResponse r = new BulkProductCreateResponse();
        r.created = ids.size();
        r.ids = ids;
        return r;
    }
}
