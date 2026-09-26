package com.stocksense.service;

import com.stocksense.entity.OperationType;
import com.stocksense.entity.SequenceCounter;
import com.stocksense.entity.Warehouse;
import com.stocksense.repository.SequenceCounterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Generates unique, human-readable reference numbers for stock documents.
 *
 * Format: {warehouse.code}/{directionCode}/{sequence, zero-padded to 4 digits}
 * Example: WH/IN/0001
 *
 * Direction code mapping:
 *   RECEIPT    → IN
 *   DELIVERY   → OUT
 *   INTERNAL   → INT
 *   ADJUSTMENT → ADJ
 *
 * Uses row-level locking (SELECT ... FOR UPDATE) on the sequence_counters table
 * to prevent duplicate references under concurrent access.
 *
 * Backend Dev 2 calls this service once per POST (receipt/delivery/transfer/adjustment)
 * and applies the returned reference + a freshly generated documentId (UUID)
 * to every StockMove row created in that call.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReferenceGeneratorService {

    private final SequenceCounterRepository sequenceCounterRepository;

    /**
     * Generate the next reference number for the given operation type and warehouse.
     * Must be called inside an existing transaction.
     *
     * @param type      the operation type (RECEIPT, DELIVERY, INTERNAL, ADJUSTMENT)
     * @param warehouse the warehouse entity
     * @return formatted reference, e.g. "WH/IN/0001"
     */
    @Transactional
    public String generate(OperationType type, Warehouse warehouse) {
        String directionCode = mapToDirectionCode(type);

        // Acquire row-level lock — the counter must already exist.
        // If it doesn't, ensureCounterExists() creates it first.
        SequenceCounter counter = sequenceCounterRepository
                .findByWarehouseIdAndDirectionCodeForUpdate(warehouse.getId(), directionCode)
                .orElseGet(() -> {
                    ensureCounterExists(warehouse.getId(), directionCode);
                    // Re-fetch with lock after creation
                    return sequenceCounterRepository
                            .findByWarehouseIdAndDirectionCodeForUpdate(warehouse.getId(), directionCode)
                            .orElseThrow(() -> new IllegalStateException(
                                    "Failed to create sequence counter for " + warehouse.getCode() + "/" + directionCode));
                });

        // Increment
        long nextValue = counter.getLastValue() + 1;
        counter.setLastValue(nextValue);
        sequenceCounterRepository.save(counter);

        String reference = String.format("%s/%s/%04d", warehouse.getCode(), directionCode, nextValue);
        log.debug("Generated reference: {}", reference);

        return reference;
    }

    /**
     * Ensures a counter row exists. If two threads race to create it,
     * the loser's insert will fail with a unique constraint violation,
     * which we safely swallow — the winner's row is what we'll lock.
     */
    private void ensureCounterExists(Long warehouseId, String directionCode) {
        try {
            // Check if it already exists (without lock) to avoid unnecessary insert attempts
            Optional<SequenceCounter> existing = sequenceCounterRepository
                    .findByWarehouseIdAndDirectionCodeForUpdate(warehouseId, directionCode);
            if (existing.isPresent()) {
                return;
            }

            SequenceCounter newCounter = SequenceCounter.builder()
                    .warehouseId(warehouseId)
                    .directionCode(directionCode)
                    .lastValue(0L)
                    .build();
            sequenceCounterRepository.saveAndFlush(newCounter);
        } catch (DataIntegrityViolationException e) {
            // Another thread already created it — that's fine
            log.debug("Sequence counter already created by another thread: {}/{}", warehouseId, directionCode);
        }
    }

    private String mapToDirectionCode(OperationType type) {
        return switch (type) {
            case RECEIPT -> "IN";
            case DELIVERY -> "OUT";
            case INTERNAL -> "INT";
            case ADJUSTMENT -> "ADJ";
        };
    }
}
