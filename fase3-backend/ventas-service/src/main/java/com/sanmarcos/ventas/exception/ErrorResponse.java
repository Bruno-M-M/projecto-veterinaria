package com.sanmarcos.ventas.exception;

import java.time.LocalDateTime;

public record ErrorResponse(int status, String error, String mensaje, LocalDateTime fecha) {

    public static ErrorResponse of(int status, String error, String mensaje) {
        return new ErrorResponse(status, error, mensaje, LocalDateTime.now());
    }
}