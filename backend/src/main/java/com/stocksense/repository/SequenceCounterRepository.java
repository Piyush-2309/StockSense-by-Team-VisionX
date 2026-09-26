package com.stocksense.repository;

import com.stocksense.entity.SequenceCounter;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SequenceCounterRepository extends JpaRepository<SequenceCounter, Long> {

    /**
     * Row-level lock to safely increment counter without duplicates.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT sc FROM SequenceCounter sc WHERE sc.warehouseId = :warehouseId AND sc.directionCode = :directionCode")
    Optional<SequenceCounter> findByWarehouseIdAndDirectionCodeForUpdate(@Param("warehouseId") Long warehouseId,
                                                                         @Param("directionCode") String directionCode);
}
