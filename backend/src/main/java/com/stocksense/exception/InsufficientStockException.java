package com.stocksense.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when stock is insufficient for an operation.
 * Owned by Backend Developer 2 but defined here so the
 * GlobalExceptionHandler can catch it uniformly.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(String message) {
        super(message);
    }
}
