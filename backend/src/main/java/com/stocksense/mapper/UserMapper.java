package com.stocksense.mapper;

import com.stocksense.dto.auth.AuthResponse;
import com.stocksense.dto.auth.UserResponse;
import com.stocksense.entity.User;

/**
 * Utility class for mapping entities to DTOs.
 * Shared across services to ensure consistent mapping.
 */
public final class UserMapper {

    private UserMapper() {
        // Utility class — no instantiation
    }

    public static UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .active(user.getActive())
                .build();
    }

    public static AuthResponse.UserInfo toUserInfo(User user) {
        return AuthResponse.UserInfo.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
