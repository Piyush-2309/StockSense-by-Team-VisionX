package com.stocksense.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Universal API response envelope used for ALL responses.
 *
 * Success:
 *   { "success": true, "data": { ... }, "timestamp": "..." }
 *
 * Error:
 *   { "success": false, "code": "DUPLICATE_SKU", "message": "SKU already exists.",
 *     "errors": { "sku": "SKU already exists." }, "path": "/api/v1/products", "timestamp": "..." }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String code;
    private String message;
    private Map<String, String> errors;
    private String path;
    private LocalDateTime timestamp;

    // --- Factory methods for convenience ---

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> created(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiResponse<Void> noContent() {
        return ApiResponse.<Void>builder()
                .success(true)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiResponse<Void> error(String code, String message, String path) {
        return ApiResponse.<Void>builder()
                .success(false)
                .code(code)
                .message(message)
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiResponse<Void> error(String code, String message, Map<String, String> errors, String path) {
        return ApiResponse.<Void>builder()
                .success(false)
                .code(code)
                .message(message)
                .errors(errors)
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
