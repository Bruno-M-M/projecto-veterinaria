package com.sanmarcos.auth.authservice.controller;

import com.sanmarcos.auth.authservice.dto.UsuarioCrearRequest;
import com.sanmarcos.auth.authservice.dto.UsuarioEditarRequest;
import com.sanmarcos.auth.authservice.dto.UsuarioResponse;
import com.sanmarcos.auth.authservice.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/usuarios")
@Tag(name = "Usuarios", description = "CRUD de usuarios. Solo ADMINISTRADOR.")
@SecurityRequirement(name = "bearer-jwt")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    @Operation(summary = "Lista todos los usuarios (nunca incluye la clave)")
    public List<UsuarioResponse> listar() {
        return usuarioService.listar();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de un usuario. 404 si no existe.")
    public UsuarioResponse obtener(@PathVariable Long id) {
        return usuarioService.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crea un usuario con el rol indicado. 409 si el correo o el RUN ya existen.")
    public UsuarioResponse crear(@Valid @RequestBody UsuarioCrearRequest req) {
        return usuarioService.crear(req);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edita un usuario. La clave es opcional: solo se cambia si viene.")
    public UsuarioResponse editar(@PathVariable Long id,
                                  @Valid @RequestBody UsuarioEditarRequest req,
                                  Principal solicitante) {
        return usuarioService.editar(id, req, solicitante.getName());
    }

    @PatchMapping("/{id}/activar")
    @Operation(summary = "Activa un usuario")
    public UsuarioResponse activar(@PathVariable Long id, Principal solicitante) {
        return usuarioService.cambiarActivo(id, true, solicitante.getName());
    }

    @PatchMapping("/{id}/desactivar")
    @Operation(summary = "Desactiva un usuario (no puede iniciar sesión). No puedes desactivarte a ti mismo.")
    public UsuarioResponse desactivar(@PathVariable Long id, Principal solicitante) {
        return usuarioService.cambiarActivo(id, false, solicitante.getName());
    }
}