package com.stocksense.service;

import com.stocksense.entity.OtpToken;
import com.stocksense.entity.User;
import com.stocksense.exception.InvalidOtpException;
import com.stocksense.exception.OtpExpiredException;
import com.stocksense.exception.OtpRateLimitException;
import com.stocksense.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.otp.expiry-minutes}")
    private int expiryMinutes;

    @Value("${app.otp.max-attempts}")
    private int maxAttempts;

    @Value("${app.otp.resend-cooldown-seconds}")
    private int resendCooldownSeconds;

    @Value("${app.otp.delivery-mode}")
    private String deliveryMode;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generates a 6-digit OTP, stores its hash, and delivers it.
     * Rate-limited: one OTP per resendCooldownSeconds.
     */
    @Transactional
    public void generateAndSendOtp(User user) {
        // Rate-limit check
        LocalDateTime cooldownSince = LocalDateTime.now().minusSeconds(resendCooldownSeconds);
        Long recentCount = otpTokenRepository.countRecentByUserId(user.getId(), cooldownSince);
        if (recentCount > 0) {
            throw new OtpRateLimitException(
                    String.format("Please wait %d seconds before requesting another OTP.", resendCooldownSeconds));
        }

        // Generate 6-digit OTP
        String rawOtp = String.format("%06d", secureRandom.nextInt(1_000_000));

        // Store hashed OTP
        OtpToken otpToken = OtpToken.builder()
                .otpHash(passwordEncoder.encode(rawOtp))
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
                .attemptCount(0)
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();
        otpTokenRepository.save(otpToken);

        // Deliver OTP
        deliverOtp(user.getEmail(), rawOtp);
    }

    /**
     * Verifies an OTP — checks expiry, max attempts, and hash match.
     */
    @Transactional
    public void verifyOtp(User user, String rawOtp) {
        Optional<OtpToken> optionalOtp = otpTokenRepository.findLatestValidByUserId(
                user.getId(), LocalDateTime.now());

        if (optionalOtp.isEmpty()) {
            throw new OtpExpiredException();
        }

        OtpToken otpToken = optionalOtp.get();

        // Check max attempts
        if (otpToken.getAttemptCount() >= maxAttempts) {
            throw new InvalidOtpException("Maximum verification attempts exceeded. Please request a new OTP.");
        }

        // Increment attempts
        otpToken.setAttemptCount(otpToken.getAttemptCount() + 1);
        otpTokenRepository.save(otpToken);

        // Verify hash
        if (!passwordEncoder.matches(rawOtp, otpToken.getOtpHash())) {
            throw new InvalidOtpException("Invalid OTP. " + (maxAttempts - otpToken.getAttemptCount()) + " attempts remaining.");
        }

        // Mark as used
        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);
    }

    private void deliverOtp(String email, String rawOtp) {
        if ("DEMO".equalsIgnoreCase(deliveryMode)) {
            log.info("=============================================================");
            log.info("  [DEMO OTP] Password reset OTP for {}: {}", email, rawOtp);
            log.info("  This OTP is only logged because OTP_DELIVERY_MODE=DEMO");
            log.info("=============================================================");
        } else {
            // Real email/SMS integration would go here
            log.warn("OTP delivery mode '{}' is not implemented. OTP was NOT delivered.", deliveryMode);
        }
    }
}
