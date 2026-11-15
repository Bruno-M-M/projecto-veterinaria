package com.sanmarcos.auth.authservice.controller;

import com.sanmarcos.auth.authservice.dto.LoginRequest;
import com.sanmarcos.auth.authservice.dto.RefreshRequest;
import com.sanmarcos.auth.authservice.dto.RegistroRequest;
import com.sanmarcos.auth.authservice.dto.TokenRespuesta;
import com.sanmarcos.auth.authservice.dto.UsuarioResponse;
import com.sanmarcos.auth.authservice.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticación", description = "Registro, login y renovación de token")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registra un cliente nuevo (rol CLIENTE). 409 si el correo o el RUN ya existen.")
    public UsuarioResponse registro(@Valid @RequestBody RegistroRequest req) {
        return authService.registrar(req);
    }

    @PostMapping("/login")
    @Operation(summary = "Entrega token de acceso y de refresco. 401 si las credenciales son incorrectas.")
    public TokenRespuesta login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renueva los tokens usando el token de refresco. 401 si está vencido o es inválido.")
    public TokenRespuesta refresh(@Valid @RequestBody RefreshRequest req) {
        return authService.refrescar(req.refreshToken());
    }
}
