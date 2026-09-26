package com.stocksense.repository;

import com.stocksense.entity.MoveStatus;
import com.stocksense.entity.OperationType;
import com.stocksense.entity.StockMove;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface StockMoveRepository extends JpaRepository<StockMove, Long> {

    /**
     * Fetch all lines of a document — the primary lookup for document-level actions.
     */
    List<StockMove> findByDocumentId(UUID documentId);

    /**
     * Filter by operation type (RECEIPT, DELIVERY, INTERNAL, ADJUSTMENT).
     */
    @Query("SELECT DISTINCT sm.documentId FROM StockMove sm WHERE sm.type = :type ORDER BY sm.documentId")
    Page<UUID> findDistinctDocumentIdsByType(@Param("type") OperationType type, Pageable pageable);

    /**
     * Filter by type and status.
     */
    @Query("SELECT DISTINCT sm.documentId FROM StockMove sm WHERE sm.type = :type AND sm.status = :status ORDER BY sm.documentId")
    Page<UUID> findDistinctDocumentIdsByTypeAndStatus(@Param("type") OperationType type,
                                                       @Param("status") MoveStatus status,
                                                       Pageable pageable);

    /**
     * Ledger view: all moves for a specific product.
     */
    List<StockMove> findByProductIdOrderByCreatedAtDesc(Long productId);

    /**
     * Recent movements, ordered by creation date.
     */
    Page<StockMove> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Moves by type and date range — for ledger filtering.
     */
    @Query("SELECT sm FROM StockMove sm WHERE sm.type = :type AND sm.createdAt BETWEEN :start AND :end ORDER BY sm.createdAt DESC")
    List<StockMove> findByTypeAndDateRange(@Param("type") OperationType type,
                                           @Param("start") LocalDateTime start,
                                           @Param("end") LocalDateTime end);

    /**
     * Moves by user.
     */
    List<StockMove> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Count documents by type and status — for dashboard stats.
     */
    @Query("SELECT COUNT(DISTINCT sm.documentId) FROM StockMove sm WHERE sm.type = :type AND sm.status = :status")
    Long countDistinctDocumentsByTypeAndStatus(@Param("type") OperationType type,
                                               @Param("status") MoveStatus status);

    /**
     * Check if a reference already exists (defensive).
     */
    boolean existsByReference(String reference);
}
