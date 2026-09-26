package com.stocksense.controller;

import com.stocksense.dto.ApiResponse;
import com.stocksense.dto.inventory.DocumentResponse;
import com.stocksense.dto.inventory.StockResponse;
import com.stocksense.dto.inventory.StockUpdateRequest;
import com.stocksense.entity.Stock;
import com.stocksense.entity.User;
import com.stocksense.exception.ResourceNotFoundException;
import com.stocksense.mapper.InventoryMapper;
import com.stocksense.repository.UserRepository;
import com.stocksense.security.CustomUserDetails;
import com.stocksense.service.OperationService;
import com.stocksense.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;
    private final OperationService operationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StockResponse>>> getAllStock() {
        return ResponseEntity.ok(ApiResponse.success(stockService.getAllStock()));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<List<StockResponse>>> getStockByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success(stockService.getStockByProduct(productId)));
    }

    @GetMapping("/location/{locationId}")
    public ResponseEntity<ApiResponse<List<StockResponse>>> getStockByLocation(@PathVariable Long locationId) {
        return ResponseEntity.ok(ApiResponse.success(stockService.getStockByLocation(locationId)));
    }

    /**
     * Direct stock update from the Stock screen (MANAGER only).
     * Creates and auto-validates a single-line ADJUSTMENT StockMove
     * to keep StockMove as the single source of truth.
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<DocumentResponse>> updateStock(
            @PathVariable Long id,
            @Valid @RequestBody StockUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        User currentUser = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getUserId()));

        Stock stock = stockService.getStockById(id);

        DocumentResponse response = operationService.createAndValidateAdjustment(
                stock.getProduct(), stock.getLocation(),
                request.getNewQuantityOnHand(), request.getReason(), currentUser);

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
