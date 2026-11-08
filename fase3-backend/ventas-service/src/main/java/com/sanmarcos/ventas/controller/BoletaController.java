package com.sanmarcos.ventas.controller;

import com.sanmarcos.ventas.dto.BoletaRequest;
import com.sanmarcos.ventas.dto.BoletaResponse;
import com.sanmarcos.ventas.service.BoletaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boletas")
@RequiredArgsConstructor
public class BoletaController {

    private final BoletaService boletaService;

    @GetMapping
    public ResponseEntity<List<BoletaResponse>> listar() {
        return ResponseEntity.ok(boletaService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoletaResponse> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(boletaService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<BoletaResponse> crear(@Valid @RequestBody BoletaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(boletaService.crear(request));
    }
}