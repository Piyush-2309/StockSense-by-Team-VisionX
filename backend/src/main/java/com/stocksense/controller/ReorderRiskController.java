package com.stocksense.controller;

import com.stocksense.dto.ApiResponse;
import com.stocksense.dto.inventory.DashboardResponse;
import com.stocksense.dto.inventory.ReorderRecommendationResponse;
import com.stocksense.entity.Product;
import com.stocksense.entity.Stock;
import com.stocksense.mapper.InventoryMapper;
import com.stocksense.repository.ProductRepository;
import com.stocksense.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/v1", "/api"})
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class ReorderRiskController {

    private final ProductRepository productRepository;
    private final StockRepository stockRepository;

    @GetMapping("/reorder/recommendations")
    public ResponseEntity<ApiResponse<List<ReorderRecommendationResponse>>> getReorderRecommendations() {
        List<Stock> allStock = stockRepository.findAll();
        Map<Long, Integer> stockByProduct = allStock.stream()
                .collect(Collectors.groupingBy(s -> s.getProduct().getId(),
                        Collectors.summingInt(Stock::getQuantityOnHand)));

        List<Product> products = productRepository.findAll();
        List<ReorderRecommendationResponse> recs = new ArrayList<>();

        for (Product product : products) {
            int currentQty = stockByProduct.getOrDefault(product.getId(), 0);
            int minStock = product.getReorderLevel() != null ? product.getReorderLevel() : 0;
            int targetStock = minStock > 0 ? (int) (minStock * 2.5) : 50;

            if (currentQty <= minStock) {
                int recommendedQty = Math.max(0, targetStock - currentQty);

                Stock primaryStock = allStock.stream()
                        .filter(s -> s.getProduct().getId().equals(product.getId()))
                        .findFirst()
                        .orElse(null);

                recs.add(ReorderRecommendationResponse.builder()
                        .productId(product.getId())
                        .productName(product.getName())
                        .sku(product.getSku())
                        .categoryName(product.getCategory() != null ? product.getCategory().getName() : "General")
                        .warehouseName(primaryStock != null && primaryStock.getLocation() != null && primaryStock.getLocation().getWarehouse() != null
                                ? primaryStock.getLocation().getWarehouse().getName() : "Main Warehouse")
                        .locationName(primaryStock != null && primaryStock.getLocation() != null
                                ? primaryStock.getLocation().getName() : "Rack A")
                        .currentStock(currentQty)
                        .minStock(minStock)
                        .targetStock(targetStock)
                        .recommendedQty(recommendedQty)
                        .status(currentQty == 0 ? "OUT_OF_STOCK" : "LOW_STOCK")
                        .build());
            }
        }

        return ResponseEntity.ok(ApiResponse.success(recs));
    }

    @GetMapping("/risk")
    public ResponseEntity<ApiResponse<List<DashboardResponse.LowStockItem>>> getInventoryRisks() {
        List<Stock> lowStock = stockRepository.findLowStockItems();
        List<DashboardResponse.LowStockItem> items = lowStock.stream()
                .map(stock -> DashboardResponse.LowStockItem.builder()
                        .productId(stock.getProduct().getId())
                        .productName(stock.getProduct().getName())
                        .sku(stock.getProduct().getSku())
                        .locationName(stock.getLocation().getName())
                        .warehouseName(stock.getLocation().getWarehouse().getName())
                        .quantityOnHand(stock.getQuantityOnHand())
                        .reorderLevel(stock.getProduct().getReorderLevel())
                        .status(InventoryMapper.computeStockStatus(
                                stock.getQuantityOnHand(), stock.getProduct().getReorderLevel()))
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(items));
    }
}
