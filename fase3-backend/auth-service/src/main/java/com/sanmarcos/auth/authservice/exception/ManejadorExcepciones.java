package com.sanmarcos.auth.authservice.exception;

import com.sanmarcos.auth.authservice.security.TokenInvalidoException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ManejadorExcepciones {

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorRespuesta> noEncontrado(RecursoNoEncontradoException ex,
                                                       HttpServletRequest req) {
        return responder(HttpStatus.NOT_FOUND, ex.getMessage(), req, null);
    }

    @ExceptionHandler(ConflictoException.class)
    public ResponseEntity<ErrorRespuesta> conflicto(ConflictoException ex, HttpServletRequest req) {
        return responder(HttpStatus.CONFLICT, ex.getMessage(), req, null);
    }

    @ExceptionHandler({NoAutorizadoException.class, TokenInvalidoException.class})
    public ResponseEntity<ErrorRespuesta> noAutorizado(RuntimeException ex, HttpServletRequest req) {
        return responder(HttpStatus.UNAUTHORIZED, ex.getMessage(), req, null);
    }

    @ExceptionHandler(ProhibidoException.class)
    public ResponseEntity<ErrorRespuesta> prohibido(ProhibidoException ex, HttpServletRequest req) {
        return responder(HttpStatus.FORBIDDEN, ex.getMessage(), req, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorRespuesta> datosInvalidos(MethodArgumentNotValidException ex,
                                                         HttpServletRequest req) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errores.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return responder(HttpStatus.BAD_REQUEST,
                "Hay datos inválidos. Revisa los campos indicados.", req, errores);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorRespuesta> cuerpoIlegible(HttpMessageNotReadableException ex,
                                                         HttpServletRequest req) {
        return responder(HttpStatus.BAD_REQUEST,
                "El cuerpo de la petición no es un JSON válido.", req, null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorRespuesta> tipoIncorrecto(MethodArgumentTypeMismatchException ex,
                                                         HttpServletRequest req) {
        return responder(HttpStatus.BAD_REQUEST,
                "El valor de '" + ex.getName() + "' no es válido.", req, null);
    }

    private ResponseEntity<ErrorRespuesta> responder(HttpStatus estado, String mensaje,
                                                     HttpServletRequest req,
                                                     Map<String, String> errores) {
        ErrorRespuesta cuerpo = new ErrorRespuesta(Instant.now(), estado.value(),
                estado.getReasonPhrase(), mensaje, req.getRequestURI(), errores);
        return ResponseEntity.status(estado).body(cuerpo);
    }
}
