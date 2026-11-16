package com.sanmarcos.ventas.controller;

import com.sanmarcos.ventas.dto.BoletaRequest;
import com.sanmarcos.ventas.dto.BoletaResponse;
import com.sanmarcos.ventas.service.BoletaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/boletas")
@RequiredArgsConstructor
public class BoletaController {

    private final BoletaService boletaService;

    @GetMapping
    public ResponseEntity<List<BoletaResponse>> listar() {
        return ResponseEntity.ok(boletaService.listarTodas());
    }

    // Cliente: solo sus propias compras. El id del cliente es el subject del token
    @GetMapping("/mias")
    public ResponseEntity<List<BoletaResponse>> misCompras(Principal principal) {
        Integer usuarioId = Integer.valueOf(principal.getName());
        return ResponseEntity.ok(boletaService.listarDeUsuario(usuarioId));
    }



    @GetMapping("/{id}")
    public ResponseEntity<BoletaResponse> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(boletaService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<BoletaResponse> crear(@Valid @RequestBody BoletaRequest request,
                                                Principal principal) {
        // El subject del token es el id del usuario que compra
        Integer usuarioId = Integer.valueOf(principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(boletaService.crear(request, usuarioId));
    }

    @PatchMapping("/{id}/anular")
    public ResponseEntity<BoletaResponse> anular(@PathVariable Integer id) {
        return ResponseEntity.ok(boletaService.anular(id));
    }

}