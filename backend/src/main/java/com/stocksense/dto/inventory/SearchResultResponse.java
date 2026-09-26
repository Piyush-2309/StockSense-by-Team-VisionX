package com.stocksense.dto.inventory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultResponse {
    private List<ProductResponse> products;
    private List<DocumentResponse> operations;
    private List<DocumentResponse> ledger;
}
