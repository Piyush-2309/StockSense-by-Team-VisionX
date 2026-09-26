package com.stocksense.service;

import com.stocksense.dto.inventory.StockResponse;
import com.stocksense.entity.Location;
import com.stocksense.entity.Product;
import com.stocksense.entity.Stock;
import com.stocksense.exception.InsufficientStockException;
import com.stocksense.exception.ResourceNotFoundException;
import com.stocksense.mapper.InventoryMapper;
import com.stocksense.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Core stock management service — all stock mutations go through here.
 * Never modify Stock directly from a controller or another service without
 * calling these methods.
 *
 * Uses pessimistic write locks (findByProductIdAndLocationIdForUpdate)
 * for safe concurrent modifications. Optimistic locking via @Version
 * provides an additional safety net.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StockService {

    private final StockRepository stockRepository;

    /**
     * Get all stock records.
     */
    @Transactional(readOnly = true)
    public List<StockResponse> getAllStock() {
        return stockRepository.findAll().stream()
                .map(InventoryMapper::toStockResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get stock records by product.
     */
    @Transactional(readOnly = true)
    public List<StockResponse> getStockByProduct(Long productId) {
        return stockRepository.findByProductId(productId).stream()
                .map(InventoryMapper::toStockResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get stock records by location.
     */
    @Transactional(readOnly = true)
    public List<StockResponse> getStockByLocation(Long locationId) {
        return stockRepository.findByLocationId(locationId).stream()
                .map(InventoryMapper::toStockResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a single stock record by ID.
     */
    @Transactional(readOnly = true)
    public Stock getStockById(Long id) {
        return stockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock", "id", id));
    }

    /**
     * Increase stock at a location (used by receipt validation).
     * Finds or creates the Stock row, then increments quantityOnHand.
     *
     * @return the resulting quantityOnHand after increase
     */
    @Transactional
    public int increaseStock(Product product, Location location, int quantity) {
        Stock stock = findOrCreateStockForUpdate(product, location);
        stock.setQuantityOnHand(stock.getQuantityOnHand() + quantity);
        stockRepository.save(stock);
        log.debug("Increased stock for product {} at location {} by {} → {}",
                product.getSku(), location.getCode(), quantity, stock.getQuantityOnHand());
        return stock.getQuantityOnHand();
    }

    /**
     * Decrease stock at a location (used by delivery validation).
     * Acquires a write lock, re-reads current quantity, validates sufficiency,
     * then decrements.
     *
     * @return the resulting quantityOnHand after decrease
     * @throws InsufficientStockException if quantityFree < quantity
     */
    @Transactional
    public int decreaseStock(Product product, Location location, int quantity) {
        Stock stock = stockRepository
                .findByProductIdAndLocationIdForUpdate(product.getId(), location.getId())
                .orElseThrow(() -> new InsufficientStockException(
                        String.format("No stock found for product '%s' at location '%s'",
                                product.getSku(), location.getCode())));

        int free = stock.getQuantityOnHand() - stock.getQuantityReserved();
        if (free < quantity) {
            throw new InsufficientStockException(
                    String.format("Insufficient stock for '%s' at '%s': requested %d, available %d",
                            product.getSku(), location.getCode(), quantity, free));
        }

        stock.setQuantityOnHand(stock.getQuantityOnHand() - quantity);
        stockRepository.save(stock);
        log.debug("Decreased stock for product {} at location {} by {} → {}",
                product.getSku(), location.getCode(), quantity, stock.getQuantityOnHand());
        return stock.getQuantityOnHand();
    }

    /**
     * Adjust stock to a specific physical count (used by adjustment validation).
     *
     * @return the resulting quantityOnHand (= physicalQuantity)
     */
    @Transactional
    public int adjustStock(Product product, Location location, int physicalQuantity) {
        Stock stock = findOrCreateStockForUpdate(product, location);
        int previousQuantity = stock.getQuantityOnHand();
        int delta = physicalQuantity - previousQuantity;

        if (stock.getQuantityOnHand() + delta < 0) {
            throw new InsufficientStockException(
                    String.format("Adjustment would result in negative stock for '%s' at '%s'",
                            product.getSku(), location.getCode()));
        }

        stock.setQuantityOnHand(physicalQuantity);
        stockRepository.save(stock);
        log.debug("Adjusted stock for product {} at location {}: {} → {} (delta: {})",
                product.getSku(), location.getCode(), previousQuantity, physicalQuantity, delta);
        return stock.getQuantityOnHand();
    }

    /**
     * Check if a product has sufficient free stock at a location.
     */
    @Transactional(readOnly = true)
    public boolean hasSufficientStock(Long productId, Long locationId, int requiredQuantity) {
        return stockRepository.findByProductIdAndLocationId(productId, locationId)
                .map(stock -> (stock.getQuantityOnHand() - stock.getQuantityReserved()) >= requiredQuantity)
                .orElse(false);
    }

    /**
     * Get total on-hand quantity across all locations for a product.
     */
    @Transactional(readOnly = true)
    public int getTotalStockForProduct(Long productId) {
        return stockRepository.sumQuantityOnHandByProductId(productId);
    }

    /**
     * Get low stock items (at or below reorder level).
     */
    @Transactional(readOnly = true)
    public List<Stock> getLowStockItems() {
        return stockRepository.findLowStockItems();
    }

    /**
     * Find or create stock for a product at a location, with pessimistic lock.
     */
    private Stock findOrCreateStockForUpdate(Product product, Location location) {
        return stockRepository.findByProductIdAndLocationIdForUpdate(product.getId(), location.getId())
                .orElseGet(() -> {
                    // No existing stock — create new row
                    Stock newStock = Stock.builder()
                            .product(product)
                            .location(location)
                            .quantityOnHand(0)
                            .quantityReserved(0)
                            .build();
                    return stockRepository.saveAndFlush(newStock);
                });
    }
}
