package com.stocksense.service;

import com.stocksense.entity.Role;
import com.stocksense.entity.User;
import com.stocksense.exception.InvalidOtpException;
import com.stocksense.exception.OtpExpiredException;
import com.stocksense.exception.OtpRateLimitException;
import com.stocksense.repository.OtpTokenRepository;
import com.stocksense.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OtpServiceTest {

    @Autowired
    private OtpService otpService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpTokenRepository otpTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;

    @BeforeEach
    void setUp() {
        otpTokenRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(User.builder()
                .name("OTP Test User")
                .email("otp@example.com")
                .passwordHash(passwordEncoder.encode("Password123"))
                .role(Role.STAFF)
                .active(true)
                .build());
    }

    @Test
    @DisplayName("Should generate OTP successfully")
    void shouldGenerateOtp() {
        assertDoesNotThrow(() -> otpService.generateAndSendOtp(testUser));
    }

    @Test
    @DisplayName("Should reject wrong OTP")
    void shouldRejectWrongOtp() {
        otpService.generateAndSendOtp(testUser);
        assertThrows(InvalidOtpException.class, () -> otpService.verifyOtp(testUser, "000000"));
    }

    @Test
    @DisplayName("Should reject expired OTP (no valid OTP exists)")
    void shouldRejectExpiredOtp() {
        // No OTP generated = treated as expired
        assertThrows(OtpExpiredException.class, () -> otpService.verifyOtp(testUser, "123456"));
    }

    @Test
    @DisplayName("Should enforce rate limiting on OTP generation")
    void shouldEnforceRateLimit() {
        otpService.generateAndSendOtp(testUser);
        // Second request within cooldown should be rate-limited
        assertThrows(OtpRateLimitException.class, () -> otpService.generateAndSendOtp(testUser));
    }
}
