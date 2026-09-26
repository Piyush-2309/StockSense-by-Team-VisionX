package com.stocksense.service;

import com.stocksense.dto.inventory.WarehouseRequest;
import com.stocksense.dto.inventory.WarehouseResponse;
import com.stocksense.entity.Warehouse;
import com.stocksense.exception.ResourceNotFoundException;
import com.stocksense.mapper.InventoryMapper;
import com.stocksense.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    @Transactional(readOnly = true)
    public List<WarehouseResponse> getAllWarehouses() {
        return warehouseRepository.findAll().stream()
                .map(InventoryMapper::toWarehouseResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WarehouseResponse getWarehouse(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", id));
        return InventoryMapper.toWarehouseResponse(warehouse);
    }

    @Transactional
    public WarehouseResponse createWarehouse(WarehouseRequest request) {
        if (warehouseRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Warehouse with code '" + request.getCode() + "' already exists");
        }

        Warehouse warehouse = Warehouse.builder()
                .name(request.getName())
                .code(request.getCode())
                .address(request.getAddress())
                .active(true)
                .build();

        warehouse = warehouseRepository.save(warehouse);
        log.info("Created warehouse: {} ({})", warehouse.getName(), warehouse.getCode());
        return InventoryMapper.toWarehouseResponse(warehouse);
    }

    @Transactional
    public WarehouseResponse updateWarehouse(Long id, WarehouseRequest request) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", id));

        warehouse.setName(request.getName());
        warehouse.setCode(request.getCode());
        warehouse.setAddress(request.getAddress());

        warehouse = warehouseRepository.save(warehouse);
        log.info("Updated warehouse: {} ({})", warehouse.getName(), warehouse.getCode());
        return InventoryMapper.toWarehouseResponse(warehouse);
    }
}
