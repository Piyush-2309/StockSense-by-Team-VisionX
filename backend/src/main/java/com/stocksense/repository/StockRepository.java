package com.stocksense.repository;

import com.stocksense.entity.Stock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {

    Optional<Stock> findByProductIdAndLocationId(Long productId, Long locationId);

    /**
     * Pessimistic write lock for safe transactional stock updates.
     * Backend Dev 2 must use this method when modifying quantities.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Stock s WHERE s.product.id = :productId AND s.location.id = :locationId")
    Optional<Stock> findByProductIdAndLocationIdForUpdate(@Param("productId") Long productId,
                                                          @Param("locationId") Long locationId);

    List<Stock> findByProductId(Long productId);

    List<Stock> findByLocationId(Long locationId);

    @Query("SELECT s FROM Stock s WHERE s.location.warehouse.id = :warehouseId")
    List<Stock> findByWarehouseId(@Param("warehouseId") Long warehouseId);

    /**
     * Products below reorder level — for low-stock alerts / dashboard.
     */
    @Query("SELECT s FROM Stock s WHERE s.quantityOnHand <= s.product.reorderLevel AND s.product.active = true")
    List<Stock> findLowStockItems();

    /**
     * Aggregate total on-hand across all locations for a product.
     */
    @Query("SELECT COALESCE(SUM(s.quantityOnHand), 0) FROM Stock s WHERE s.product.id = :productId")
    Integer sumQuantityOnHandByProductId(@Param("productId") Long productId);
}
