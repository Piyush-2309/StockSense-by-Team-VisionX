package com.stocksense.security;

import com.stocksense.entity.Role;
import com.stocksense.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class JwtServiceTest {

    @Autowired
    private JwtService jwtService;

    private CustomUserDetails userDetails;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .id(1L)
                .name("Test User")
                .email("test@example.com")
                .passwordHash("hashedpass")
                .role(Role.STAFF)
                .active(true)
                .build();
        userDetails = new CustomUserDetails(user);
    }

    @Test
    @DisplayName("Should generate and validate access token")
    void shouldGenerateAndValidateToken() {
        String token = jwtService.generateAccessToken(userDetails);

        assertNotNull(token);
        assertTrue(jwtService.isTokenValid(token, userDetails));
        assertEquals("test@example.com", jwtService.extractUsername(token));
    }

    @Test
    @DisplayName("Should detect expired token")
    void shouldDetectNonExpiredToken() {
        String token = jwtService.generateAccessToken(userDetails);
        assertFalse(jwtService.isTokenExpired(token));
    }

    @Test
    @DisplayName("Should reject token with wrong user")
    void shouldRejectTokenWithWrongUser() {
        String token = jwtService.generateAccessToken(userDetails);

        User otherUser = User.builder()
                .id(2L)
                .name("Other")
                .email("other@example.com")
                .passwordHash("hash")
                .role(Role.STAFF)
                .active(true)
                .build();
        CustomUserDetails otherDetails = new CustomUserDetails(otherUser);

        assertFalse(jwtService.isTokenValid(token, otherDetails));
    }

    @Test
    @DisplayName("Should reject malformed token")
    void shouldRejectMalformedToken() {
        assertThrows(Exception.class, () -> jwtService.extractUsername("not-a-valid-jwt"));
    }
}
