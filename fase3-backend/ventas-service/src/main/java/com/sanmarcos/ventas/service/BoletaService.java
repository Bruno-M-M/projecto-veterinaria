package com.sanmarcos.ventas.service;

import com.sanmarcos.ventas.dto.BoletaRequest;
import com.sanmarcos.ventas.dto.BoletaResponse;
import com.sanmarcos.ventas.exception.ResourceNotFoundException;
import com.sanmarcos.ventas.model.Boleta;
import com.sanmarcos.ventas.repository.BoletaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service // <-- Spring detecta este bean directamente
@RequiredArgsConstructor
public class BoletaService {

    private final BoletaRepository boletaRepository;

    public List<BoletaResponse> listarTodas() {
        return boletaRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public BoletaResponse obtenerPorId(Integer id) {
        Boleta boleta = boletaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boleta no encontrada con ID: " + id));
        return mapToResponse(boleta);
    }

    public BoletaResponse crear(BoletaRequest request) {
        Boleta boleta = new Boleta();
        boleta.setUsuarioId(request.getUsuarioId());
        boleta.setFecha(LocalDateTime.now());
        boleta.setTotal(request.getTotal());
        boleta.setEstado(request.getEstado());

        Boleta guardada = boletaRepository.save(boleta);
        return mapToResponse(guardada);
    }

    private BoletaResponse mapToResponse(Boleta boleta) {
        return BoletaResponse.builder()
                .id(boleta.getId())
                .usuarioId(boleta.getUsuarioId())
                .fecha(boleta.getFecha())
                .total(boleta.getTotal())
                .estado(boleta.getEstado())
                .build();
    }
}