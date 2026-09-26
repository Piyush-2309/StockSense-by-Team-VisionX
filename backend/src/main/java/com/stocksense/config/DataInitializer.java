package com.stocksense.config;

import com.stocksense.entity.*;
import com.stocksense.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Enterprise seed data initializer.
 * Populates categories, warehouses, locations, products, initial stock levels,
 * demo accounts, and stock moves across environments automatically.
 *
 * Demo accounts:
 *   - manager@stocksense.com / Password123 (MANAGER)
 *   - staff@stocksense.com   / Password123 (STAFF)
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Profile("!test")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final LocationRepository locationRepository;
    private final ProductRepository productRepository;
    private final StockRepository stockRepository;
    private final StockMoveRepository stockMoveRepository;
    private final SequenceCounterRepository sequenceCounterRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedCategories();
        seedWarehousesAndLocations();
        seedProducts();
        seedStock();
        seedUsersAndMoves();
        log.info("StockSense enterprise seed initialization complete.");
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0) return;
        log.info("Seeding product categories...");
        categoryRepository.saveAll(List.of(
                Category.builder().name("Raw Materials").description("Base industrial materials").active(true).build(),
                Category.builder().name("Components").description("Parts and assemblies").active(true).build(),
                Category.builder().name("Finished Goods").description("Completed inventory ready for shipment").active(true).build(),
                Category.builder().name("Packaging").description("Cartons, pallets and packaging").active(true).build()
        ));
    }

    private void seedWarehousesAndLocations() {
        if (warehouseRepository.count() > 0) return;
        log.info("Seeding warehouses and hierarchical locations...");

        Warehouse wh1 = warehouseRepository.save(Warehouse.builder()
                .name("Main Warehouse")
                .code("WH")
                .address("123 Industrial Avenue, City Center")
                .active(true)
                .build());

        Warehouse wh2 = warehouseRepository.save(Warehouse.builder()
                .name("Warehouse 2")
                .code("WH2")
                .address("456 Distribution Road, East District")
                .active(true)
                .build());

        // WH Locations
        Location rackA = locationRepository.save(Location.builder()
                .name("Rack A")
                .code("WH-RA")
                .warehouse(wh1)
                .active(true)
                .build());

        Location rackB = locationRepository.save(Location.builder()
                .name("Rack B")
                .code("WH-RB")
                .warehouse(wh1)
                .active(true)
                .build());

        Location prodArea = locationRepository.save(Location.builder()
                .name("Production Area")
                .code("WH-PA")
                .warehouse(wh1)
                .active(true)
                .build());

        locationRepository.save(Location.builder()
                .name("Rack P1")
                .code("WH-PA-P1")
                .warehouse(wh1)
                .parentLocation(prodArea)
                .active(true)
                .build());

        locationRepository.save(Location.builder()
                .name("Rack P2")
                .code("WH-PA-P2")
                .warehouse(wh1)
                .parentLocation(prodArea)
                .active(true)
                .build());

        // WH2 Locations
        locationRepository.save(Location.builder()
                .name("Rack C")
                .code("WH2-RC")
                .warehouse(wh2)
                .active(true)
                .build());

        // Pre-seed sequence counters
        sequenceCounterRepository.save(SequenceCounter.builder()
                .warehouseId(wh1.getId())
                .directionCode("IN")
                .lastValue(1L)
                .build());
        sequenceCounterRepository.save(SequenceCounter.builder()
                .warehouseId(wh1.getId())
                .directionCode("OUT")
                .lastValue(1L)
                .build());
        sequenceCounterRepository.save(SequenceCounter.builder()
                .warehouseId(wh1.getId())
                .directionCode("INT")
                .lastValue(1L)
                .build());
    }

    private void seedProducts() {
        if (productRepository.count() > 0) return;
        log.info("Seeding products...");

        Category raw = categoryRepository.findByName("Raw Materials").orElseThrow();
        Category comp = categoryRepository.findByName("Components").orElseThrow();
        Category finished = categoryRepository.findByName("Finished Goods").orElseThrow();
        Category pkg = categoryRepository.findByName("Packaging").orElseThrow();

        productRepository.saveAll(List.of(
                Product.builder().name("Steel Rod").sku("STL-ROD-001").category(raw).unitOfMeasure("pieces").unitCost(BigDecimal.valueOf(25.50)).reorderLevel(50).active(true).build(),
                Product.builder().name("Copper Wire").sku("CPR-WIR-001").category(raw).unitOfMeasure("meters").unitCost(BigDecimal.valueOf(12.75)).reorderLevel(100).active(true).build(),
                Product.builder().name("Bearings").sku("BRG-STD-001").category(comp).unitOfMeasure("pieces").unitCost(BigDecimal.valueOf(8.90)).reorderLevel(200).active(true).build(),
                Product.builder().name("Plastic Sheets").sku("PLS-SHT-001").category(raw).unitOfMeasure("sheets").unitCost(BigDecimal.valueOf(15.00)).reorderLevel(30).active(true).build(),
                Product.builder().name("Office Chairs").sku("OFC-CHR-001").category(finished).unitOfMeasure("pieces").unitCost(BigDecimal.valueOf(150.00)).reorderLevel(10).active(true).build(),
                Product.builder().name("Packaging Boxes").sku("PKG-BOX-001").category(pkg).unitOfMeasure("pieces").unitCost(BigDecimal.valueOf(2.50)).reorderLevel(500).active(true).build()
        ));
    }

    private void seedStock() {
        if (stockRepository.count() > 0) return;
        log.info("Seeding initial stock levels...");

        Product steel = productRepository.findBySku("STL-ROD-001").orElse(null);
        Product copper = productRepository.findBySku("CPR-WIR-001").orElse(null);
        Product bearings = productRepository.findBySku("BRG-STD-001").orElse(null);
        Product plastic = productRepository.findBySku("PLS-SHT-001").orElse(null);
        Product chairs = productRepository.findBySku("OFC-CHR-001").orElse(null);
        Product boxes = productRepository.findBySku("PKG-BOX-001").orElse(null);

        Location rackA = locationRepository.findByCode("WH-RA").orElse(null);
        Location rackB = locationRepository.findByCode("WH-RB").orElse(null);
        Location rackP1 = locationRepository.findByCode("WH-PA-P1").orElse(null);
        Location rackC = locationRepository.findByCode("WH2-RC").orElse(null);

        if (steel != null && rackA != null) {
            stockRepository.save(Stock.builder().product(steel).location(rackA).quantityOnHand(45).quantityReserved(0).build());
        }
        if (copper != null && rackA != null) {
            stockRepository.save(Stock.builder().product(copper).location(rackA).quantityOnHand(250).quantityReserved(0).build());
        }
        if (bearings != null && rackB != null) {
            stockRepository.save(Stock.builder().product(bearings).location(rackB).quantityOnHand(150).quantityReserved(20).build());
        }
        if (plastic != null && rackB != null) {
            stockRepository.save(Stock.builder().product(plastic).location(rackB).quantityOnHand(60).quantityReserved(0).build());
        }
        if (chairs != null && rackP1 != null) {
            stockRepository.save(Stock.builder().product(chairs).location(rackP1).quantityOnHand(25).quantityReserved(0).build());
        }
        if (boxes != null && rackC != null) {
            stockRepository.save(Stock.builder().product(boxes).location(rackC).quantityOnHand(300).quantityReserved(50).build());
        }
        if (steel != null && rackC != null) {
            stockRepository.save(Stock.builder().product(steel).location(rackC).quantityOnHand(30).quantityReserved(0).build());
        }
        if (copper != null && rackP1 != null) {
            stockRepository.save(Stock.builder().product(copper).location(rackP1).quantityOnHand(100).quantityReserved(0).build());
        }
    }

    private void seedUsersAndMoves() {
        if (userRepository.count() > 0) return;
        log.info("Seeding demo users and initial documents...");

        User manager = userRepository.save(User.builder()
                .name("Admin Manager")
                .email("manager@stocksense.com")
                .passwordHash(passwordEncoder.encode("Password123"))
                .role(Role.MANAGER)
                .active(true)
                .build());

        User staff = userRepository.save(User.builder()
                .name("John Staff")
                .email("staff@stocksense.com")
                .passwordHash(passwordEncoder.encode("Password123"))
                .role(Role.STAFF)
                .active(true)
                .build());

        log.info("Seeded users: manager@stocksense.com, staff@stocksense.com (password: Password123)");

        Product steel = productRepository.findBySku("STL-ROD-001").orElse(null);
        Product copper = productRepository.findBySku("CPR-WIR-001").orElse(null);
        Product bearings = productRepository.findBySku("BRG-STD-001").orElse(null);
        Location rackA = locationRepository.findByCode("WH-RA").orElse(null);
        Location rackB = locationRepository.findByCode("WH-RB").orElse(null);
        Location rackP1 = locationRepository.findByCode("WH-PA-P1").orElse(null);

        if (steel != null && rackA != null) {
            UUID receiptDocId = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
            stockMoveRepository.save(StockMove.builder()
                    .documentId(receiptDocId)
                    .reference("WH/IN/0001")
                    .type(OperationType.RECEIPT)
                    .status(MoveStatus.DRAFT)
                    .product(steel)
                    .quantity(100)
                    .destinationLocation(rackA)
                    .partnerName("SteelCorp Ltd.")
                    .responsible(manager)
                    .user(manager)
                    .build());

            if (copper != null) {
                stockMoveRepository.save(StockMove.builder()
                        .documentId(receiptDocId)
                        .reference("WH/IN/0001")
                        .type(OperationType.RECEIPT)
                        .status(MoveStatus.DRAFT)
                        .product(copper)
                        .quantity(500)
                        .destinationLocation(rackA)
                        .partnerName("SteelCorp Ltd.")
                        .responsible(manager)
                        .user(manager)
                        .build());
            }
        }

        if (bearings != null && rackB != null) {
            UUID deliveryDocId = UUID.fromString("b2c3d4e5-f6a7-8901-bcde-f12345678901");
            stockMoveRepository.save(StockMove.builder()
                    .documentId(deliveryDocId)
                    .reference("WH/OUT/0001")
                    .type(OperationType.DELIVERY)
                    .status(MoveStatus.WAITING)
                    .product(bearings)
                    .quantity(50)
                    .sourceLocation(rackB)
                    .partnerName("BuildRight Inc.")
                    .responsible(staff)
                    .user(staff)
                    .scheduledDate(LocalDate.now().plusDays(3))
                    .build());
        }

        if (copper != null && rackA != null && rackP1 != null) {
            UUID transferDocId = UUID.fromString("c3d4e5f6-a7b8-9012-cdef-123456789012");
            stockMoveRepository.save(StockMove.builder()
                    .documentId(transferDocId)
                    .reference("WH/INT/0001")
                    .type(OperationType.INTERNAL)
                    .status(MoveStatus.DONE)
                    .product(copper)
                    .quantity(100)
                    .sourceLocation(rackA)
                    .destinationLocation(rackP1)
                    .responsible(manager)
                    .user(manager)
                    .validatedBy(manager)
                    .resultingQuantity(100)
                    .build());
        }
    }
}
