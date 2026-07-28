package com.example.backend.exception;

import lombok.Getter;

import java.util.Map;

@Getter
public class FieldValidationException extends RuntimeException {

    private final Map<String, String> fieldErrors;

    public FieldValidationException(Map<String, String> fieldErrors) {
        super("Validation failed");
        this.fieldErrors = fieldErrors;
    }
}
