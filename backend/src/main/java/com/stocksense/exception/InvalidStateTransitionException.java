package com.stocksense.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown on invalid state transitions (e.g. DRAFT → DONE skipping validation).
 * Owned by Backend Developer 2.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidStateTransitionException extends RuntimeException {

    public InvalidStateTransitionException(String message) {
        super(message);
    }
}
