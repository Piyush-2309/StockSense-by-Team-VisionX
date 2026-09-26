package com.stocksense.controller;

import com.stocksense.dto.ApiResponse;
import com.stocksense.dto.inventory.DocumentResponse;
import com.stocksense.dto.inventory.ProductResponse;
import com.stocksense.dto.inventory.SearchResultResponse;
import com.stocksense.entity.StockMove;
import com.stocksense.mapper.InventoryMapper;
import com.stocksense.repository.ProductRepository;
import com.stocksense.repository.StockMoveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/v1/search", "/api/search"})
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class SearchController {

    private final ProductRepository productRepository;
    private final StockMoveRepository stockMoveRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<SearchResultResponse>> globalSearch(
            @RequestParam(defaultValue = "") String q) {

        String query = q.trim();
        if (query.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(
                    SearchResultResponse.builder()
                            .products(Collections.emptyList())
                            .operations(Collections.emptyList())
                            .ledger(Collections.emptyList())
                            .build()));
        }

        // 1. Search products by name or SKU
        List<ProductResponse> products = productRepository.searchByNameOrSku(query, PageRequest.of(0, 10, Sort.by("name")))
                .getContent()
                .stream()
                .map(p -> InventoryMapper.toProductResponse(p, 0))
                .collect(Collectors.toList());

        // 2. Search stock moves (operations and ledger)
        List<StockMove> matchingMoves = stockMoveRepository.findAll().stream()
                .filter(m -> (m.getReference() != null && m.getReference().toLowerCase().contains(query.toLowerCase()))
                        || (m.getProduct() != null && (m.getProduct().getName().toLowerCase().contains(query.toLowerCase())
                        || m.getProduct().getSku().toLowerCase().contains(query.toLowerCase())))
                        || (m.getPartnerName() != null && m.getPartnerName().toLowerCase().contains(query.toLowerCase())))
                .collect(Collectors.toList());

        // Group by documentId
        Map<UUID, List<StockMove>> byDoc = matchingMoves.stream()
                .collect(Collectors.groupingBy(StockMove::getDocumentId));

        List<DocumentResponse> operations = byDoc.values().stream()
                .map(InventoryMapper::toDocumentResponse)
                .limit(10)
                .collect(Collectors.toList());

        List<DocumentResponse> ledger = operations;

        return ResponseEntity.ok(ApiResponse.success(
                SearchResultResponse.builder()
                        .products(products)
                        .operations(operations)
                        .ledger(ledger)
                        .build()));
    }
}
