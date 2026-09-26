package com.stocksense.service;

import com.stocksense.dto.auth.*;
import com.stocksense.entity.Role;
import com.stocksense.entity.User;
import com.stocksense.exception.DuplicateEmailException;
import com.stocksense.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("Signup Tests")
    class SignupTests {

        @Test
        @DisplayName("Should register a new user with STAFF role")
        void shouldRegisterNewUser() {
            SignupRequest request = SignupRequest.builder()
                    .name("Test User")
                    .email("test@example.com")
                    .password("Password123")
                    .build();

            UserResponse response = authService.signup(request);

            assertNotNull(response.getId());
            assertEquals("Test User", response.getName());
            assertEquals("test@example.com", response.getEmail());
            assertEquals("STAFF", response.getRole());
            assertTrue(response.getActive());

            // Verify password is hashed
            User savedUser = userRepository.findByEmail("test@example.com").orElseThrow();
            assertTrue(passwordEncoder.matches("Password123", savedUser.getPasswordHash()));
        }

        @Test
        @DisplayName("Should reject duplicate email")
        void shouldRejectDuplicateEmail() {
            SignupRequest request = SignupRequest.builder()
                    .name("User One")
                    .email("duplicate@example.com")
                    .password("Password123")
                    .build();
            authService.signup(request);

            SignupRequest duplicateRequest = SignupRequest.builder()
                    .name("User Two")
                    .email("duplicate@example.com")
                    .password("Password456")
                    .build();

            assertThrows(DuplicateEmailException.class, () -> authService.signup(duplicateRequest));
        }

        @Test
        @DisplayName("Self-signup should always assign STAFF role")
        void shouldAlwaysAssignStaffRole() {
            SignupRequest request = SignupRequest.builder()
                    .name("Staff User")
                    .email("staff@example.com")
                    .password("Password123")
                    .build();

            UserResponse response = authService.signup(request);
            assertEquals("STAFF", response.getRole());
        }
    }

    @Nested
    @DisplayName("Login Tests")
    class LoginTests {

        @BeforeEach
        void createTestUser() {
            User user = User.builder()
                    .name("Login Test")
                    .email("login@example.com")
                    .passwordHash(passwordEncoder.encode("CorrectPass123"))
                    .role(Role.STAFF)
                    .active(true)
                    .build();
            userRepository.save(user);
        }

        @Test
        @DisplayName("Should login with valid credentials")
        void shouldLoginWithValidCredentials() {
            LoginRequest request = LoginRequest.builder()
                    .email("login@example.com")
                    .password("CorrectPass123")
                    .build();

            AuthResponse response = authService.login(request);

            assertNotNull(response.getAccessToken());
            assertNotNull(response.getRefreshToken());
            assertEquals("Bearer", response.getTokenType());
            assertTrue(response.getExpiresIn() > 0);
            assertEquals("login@example.com", response.getUser().getEmail());
            assertEquals("STAFF", response.getUser().getRole());
        }

        @Test
        @DisplayName("Should reject invalid password")
        void shouldRejectInvalidPassword() {
            LoginRequest request = LoginRequest.builder()
                    .email("login@example.com")
                    .password("WrongPassword")
                    .build();

            assertThrows(BadCredentialsException.class, () -> authService.login(request));
        }
    }

    @Nested
    @DisplayName("Token Refresh Tests")
    class RefreshTests {

        @Test
        @DisplayName("Should refresh token with valid refresh token")
        void shouldRefreshToken() {
            // First, sign up and login
            authService.signup(SignupRequest.builder()
                    .name("Refresh User")
                    .email("refresh@example.com")
                    .password("Password123")
                    .build());

            AuthResponse loginResponse = authService.login(LoginRequest.builder()
                    .email("refresh@example.com")
                    .password("Password123")
                    .build());

            // Refresh
            RefreshTokenRequest refreshRequest = RefreshTokenRequest.builder()
                    .refreshToken(loginResponse.getRefreshToken())
                    .build();

            AuthResponse refreshResponse = authService.refresh(refreshRequest);

            assertNotNull(refreshResponse.getAccessToken());
            assertNotNull(refreshResponse.getRefreshToken());
            // Old refresh token should be different from new one
            assertNotEquals(loginResponse.getRefreshToken(), refreshResponse.getRefreshToken());
        }

        @Test
        @DisplayName("Should reject invalid refresh token")
        void shouldRejectInvalidRefreshToken() {
            RefreshTokenRequest request = RefreshTokenRequest.builder()
                    .refreshToken("invalid-token-value")
                    .build();

            assertThrows(Exception.class, () -> authService.refresh(request));
        }
    }
}
