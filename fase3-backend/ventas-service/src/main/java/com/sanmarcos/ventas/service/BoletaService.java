package com.sanmarcos.ventas.service;

import com.sanmarcos.ventas.client.ProductoClient;
import com.sanmarcos.ventas.client.ProductoInfo;
import com.sanmarcos.ventas.dto.*;
import com.sanmarcos.ventas.exception.ResourceNotFoundException;
import com.sanmarcos.ventas.exception.StockInsuficienteException;
import com.sanmarcos.ventas.model.Boleta;
import com.sanmarcos.ventas.model.DetalleBoleta;
import com.sanmarcos.ventas.repository.BoletaRepository;
import com.sanmarcos.ventas.repository.DetalleBoletaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BoletaService {

    private final BoletaRepository boletaRepository;
    private final DetalleBoletaRepository detalleRepository;
    private final ProductoClient productoClient;

    @Transactional(readOnly = true)
    public List<BoletaResponse> listarTodas() {
        return boletaRepository.findAll().stream()
                .map(b -> mapToResponse(b, detalleRepository.findByBoletaId(b.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public BoletaResponse obtenerPorId(Integer id) {
        Boleta boleta = boletaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Boleta no encontrada con ID: " + id));
        return mapToResponse(boleta, detalleRepository.findByBoletaId(id));
    }

    @Transactional
    public BoletaResponse crear(BoletaRequest request) {
        // 1. Armar los detalles con el precio actual y validar stock (todavía no se guarda nada)
        List<DetalleBoleta> detalles = new ArrayList<>();
        double total = 0;

        for (ItemBoletaRequest item : request.getItems()) {
            ProductoInfo info = productoClient.obtener(item.getProductoId());
            if (info.stock() < item.getCantidad()) {
                throw new StockInsuficienteException(
                        "Stock insuficiente para " + info.nombre()
                                + " (disponible: " + info.stock() + ")");
            }

            DetalleBoleta detalle = new DetalleBoleta();
            detalle.setProductoId(info.id());
            detalle.setCantidad(item.getCantidad());
            detalle.setPrecioUnitario(info.precio());
            detalle.setSubtotal(info.precio() * item.getCantidad());
            detalles.add(detalle);

            total += detalle.getSubtotal();
        }

        // 2. Guardar la boleta
        Boleta boleta = new Boleta();
        boleta.setUsuarioId(request.getUsuarioId());
        boleta.setFecha(LocalDateTime.now());
        boleta.setTotal(total);
        boleta.setEstado(true); // PAGADA
        Boleta guardada = boletaRepository.save(boleta);

        // 3. Guardar los detalles, ligados a la boleta
        for (DetalleBoleta detalle : detalles) {
            detalle.setBoleta(guardada);
        }
        List<DetalleBoleta> detallesGuardados = detalleRepository.saveAll(detalles);

        // 4. Descontar el stock
        for (ItemBoletaRequest item : request.getItems()) {
            productoClient.descontarStock(item.getProductoId(), item.getCantidad());
        }

        return mapToResponse(guardada, detallesGuardados);
    }

    private BoletaResponse mapToResponse(Boleta boleta, List<DetalleBoleta> detalles) {
        List<DetalleBoletaResponse> detallesResponse = detalles.stream()
                .map(d -> DetalleBoletaResponse.builder()
                        .id(d.getId())
                        .productoId(d.getProductoId())
                        .cantidad(d.getCantidad())
                        .precioUnitario(d.getPrecioUnitario())
                        .subtotal(d.getSubtotal())
                        .build())
                .toList();

        return BoletaResponse.builder()
                .id(boleta.getId())
                .usuarioId(boleta.getUsuarioId())
                .fecha(boleta.getFecha())
                .total(boleta.getTotal())
                .estado(boleta.getEstado())
                .detalles(detallesResponse)
                .build();
    }
}