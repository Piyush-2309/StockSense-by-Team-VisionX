package com.stocksense.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidOtpException extends RuntimeException {

    public InvalidOtpException() {
        super("Invalid OTP.");
    }

    public InvalidOtpException(String message) {
        super(message);
    }
}
