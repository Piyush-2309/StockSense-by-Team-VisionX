package com.stocksense.service;

import com.stocksense.dto.inventory.LocationRequest;
import com.stocksense.dto.inventory.LocationResponse;
import com.stocksense.entity.Location;
import com.stocksense.entity.Warehouse;
import com.stocksense.exception.InvalidLocationException;
import com.stocksense.exception.ResourceNotFoundException;
import com.stocksense.mapper.InventoryMapper;
import com.stocksense.repository.LocationRepository;
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
public class LocationService {

    private final LocationRepository locationRepository;
    private final WarehouseRepository warehouseRepository;

    @Transactional(readOnly = true)
    public List<LocationResponse> getAllLocations(Long warehouseId, Long parentLocationId, Boolean active) {
        List<Location> locations;

        if (warehouseId != null && parentLocationId != null) {
            locations = locationRepository.findByParentLocationId(parentLocationId);
        } else if (warehouseId != null) {
            if (Boolean.TRUE.equals(active)) {
                locations = locationRepository.findByWarehouseId(warehouseId).stream()
                        .filter(l -> l.getActive())
                        .collect(Collectors.toList());
            } else {
                locations = locationRepository.findByWarehouseId(warehouseId);
            }
        } else {
            locations = locationRepository.findAll();
        }

        if (Boolean.TRUE.equals(active) && warehouseId == null) {
            locations = locations.stream()
                    .filter(l -> l.getActive())
                    .collect(Collectors.toList());
        }

        return locations.stream()
                .map(InventoryMapper::toLocationResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LocationResponse getLocation(Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "id", id));
        return InventoryMapper.toLocationResponse(location);
    }

    @Transactional
    public LocationResponse createLocation(LocationRequest request) {
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", request.getWarehouseId()));

        Location.LocationBuilder builder = Location.builder()
                .name(request.getName())
                .code(request.getCode())
                .warehouse(warehouse)
                .active(true);

        if (request.getParentLocationId() != null) {
            Location parent = locationRepository.findById(request.getParentLocationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Location", "id", request.getParentLocationId()));
            // Validate parent belongs to same warehouse
            if (!parent.getWarehouse().getId().equals(warehouse.getId())) {
                throw new InvalidLocationException("Parent location must belong to the same warehouse");
            }
            builder.parentLocation(parent);
        }

        Location location = locationRepository.save(builder.build());
        log.info("Created location: {} ({}) in warehouse {}", location.getName(), location.getCode(), warehouse.getCode());
        return InventoryMapper.toLocationResponse(location);
    }

    @Transactional
    public LocationResponse updateLocation(Long id, LocationRequest request) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "id", id));

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", "id", request.getWarehouseId()));

        location.setName(request.getName());
        location.setCode(request.getCode());
        location.setWarehouse(warehouse);

        if (request.getParentLocationId() != null) {
            Location parent = locationRepository.findById(request.getParentLocationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Location", "id", request.getParentLocationId()));
            if (!parent.getWarehouse().getId().equals(warehouse.getId())) {
                throw new InvalidLocationException("Parent location must belong to the same warehouse");
            }
            location.setParentLocation(parent);
        } else {
            location.setParentLocation(null);
        }

        location = locationRepository.save(location);
        log.info("Updated location: {} ({})", location.getName(), location.getCode());
        return InventoryMapper.toLocationResponse(location);
    }

    @Transactional
    public void deleteLocation(Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "id", id));
        location.setActive(false);
        locationRepository.save(location);
        log.info("Deactivated location: {} ({})", location.getName(), location.getCode());
    }
}
