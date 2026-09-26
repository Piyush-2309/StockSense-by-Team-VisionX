package com.stocksense.repository;

import com.stocksense.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {

    List<Location> findByWarehouseId(Long warehouseId);

    List<Location> findByWarehouseIdAndParentLocationIsNull(Long warehouseId);

    List<Location> findByParentLocationId(Long parentLocationId);

    boolean existsByCode(String code);
}
