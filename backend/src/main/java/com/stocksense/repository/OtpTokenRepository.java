package com.stocksense.repository;

import com.stocksense.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    /**
     * Find the most recent unused, non-expired OTP for a user.
     */
    @Query("SELECT o FROM OtpToken o WHERE o.user.id = :userId AND o.used = false AND o.expiresAt > :now ORDER BY o.createdAt DESC LIMIT 1")
    Optional<OtpToken> findLatestValidByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Count OTPs created within the cooldown period for rate limiting.
     */
    @Query("SELECT COUNT(o) FROM OtpToken o WHERE o.user.id = :userId AND o.createdAt > :since")
    Long countRecentByUserId(@Param("userId") Long userId, @Param("since") LocalDateTime since);
}
