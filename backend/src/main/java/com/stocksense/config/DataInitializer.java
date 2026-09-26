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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Seeds users and StockMove documents at startup.
 * Users must be created at runtime because BCrypt hashes cannot be
 * pre-computed reliably in a static SQL migration.
 *
 * Only runs if the users table is empty (first-time startup).
 *
 * Credentials for demo:
 *   - manager@stocksense.com / Password123 (MANAGER)
 *   - staff@stocksense.com   / Password123 (STAFF)
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Profile("!test")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StockMoveRepository stockMoveRepository;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Users already exist — skipping seed data.");
            return;
        }

        log.info("Seeding demo users and stock moves...");

        // --- Users ---
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

        // --- StockMove documents ---
        // These need valid user FK references, so they must be created here.
        seedStockMoves(manager, staff);

        log.info("Demo seed data complete.");
    }

    private void seedStockMoves(User manager, User staff) {
        // Fetch referenced entities
        Product steelRod = productRepository.findBySku("STL-ROD-001").orElse(null);
        Product copperWire = productRepository.findBySku("CPR-WIR-001").orElse(null);
        Product bearings = productRepository.findBySku("BRG-STD-001").orElse(null);

        if (steelRod == null || copperWire == null || bearings == null) {
            log.warn("Products not found — skipping StockMove seed data. Run Flyway migrations first.");
            return;
        }

        // Locations: Rack A (id context), Rack B, Rack P1
        var locations = locationRepository.findAll();
        Location rackA = locations.stream().filter(l -> "WH-RA".equals(l.getCode())).findFirst().orElse(null);
        Location rackB = locations.stream().filter(l -> "WH-RB".equals(l.getCode())).findFirst().orElse(null);
        Location rackP1 = locations.stream().filter(l -> "WH-PA-P1".equals(l.getCode())).findFirst().orElse(null);

        if (rackA == null || rackB == null || rackP1 == null) {
            log.warn("Locations not found — skipping StockMove seed data.");
            return;
        }

        // 1. DRAFT receipt: 2 product lines, WH/IN/0001
        UUID receiptDocId = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
        stockMoveRepository.save(StockMove.builder()
                .documentId(receiptDocId)
                .reference("WH/IN/0001")
                .type(OperationType.RECEIPT)
                .status(MoveStatus.DRAFT)
                .product(steelRod)
                .quantity(100)
                .destinationLocation(rackA)
                .partnerName("SteelCorp Ltd.")
                .responsible(manager)
                .user(manager)
                .build());

        stockMoveRepository.save(StockMove.builder()
                .documentId(receiptDocId)
                .reference("WH/IN/0001")
                .type(OperationType.RECEIPT)
                .status(MoveStatus.DRAFT)
                .product(copperWire)
                .quantity(500)
                .destinationLocation(rackA)
                .partnerName("SteelCorp Ltd.")
                .responsible(manager)
                .user(manager)
                .build());

        // 2. WAITING delivery: 1 product line, WH/OUT/0001
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

        // 3. DONE transfer: 1 product line, WH/INT/0001
        UUID transferDocId = UUID.fromString("c3d4e5f6-a7b8-9012-cdef-123456789012");
        stockMoveRepository.save(StockMove.builder()
                .documentId(transferDocId)
                .reference("WH/INT/0001")
                .type(OperationType.INTERNAL)
                .status(MoveStatus.DONE)
                .product(copperWire)
                .quantity(100)
                .sourceLocation(rackA)
                .destinationLocation(rackP1)
                .responsible(manager)
                .user(manager)
                .validatedBy(manager)
                .resultingQuantity(100)
                .build());

        log.info("Seeded 3 StockMove documents (DRAFT receipt, WAITING delivery, DONE transfer)");
    }
}
