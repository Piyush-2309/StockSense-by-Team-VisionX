package com.stocksense.controller;

import com.stocksense.dto.ApiResponse;
import com.stocksense.dto.inventory.LocationRequest;
import com.stocksense.dto.inventory.LocationResponse;
import com.stocksense.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getAllLocations(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long parentLocationId,
            @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(ApiResponse.success(
                locationService.getAllLocations(warehouseId, parentLocationId, active)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LocationResponse>> getLocation(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(locationService.getLocation(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<LocationResponse>> createLocation(
            @Valid @RequestBody LocationRequest request) {
        LocationResponse response = locationService.createLocation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<LocationResponse>> updateLocation(
            @PathVariable Long id, @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(locationService.updateLocation(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteLocation(@PathVariable Long id) {
        locationService.deleteLocation(id);
        return ResponseEntity.ok(ApiResponse.noContent());
    }
}
