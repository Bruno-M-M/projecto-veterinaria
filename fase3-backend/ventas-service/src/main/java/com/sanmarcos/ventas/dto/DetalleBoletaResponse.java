package com.sanmarcos.ventas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DetalleBoletaResponse {
    private Integer id;
    private Integer productoId;
    private Integer cantidad;
    private Double precioUnitario;
    private Double subtotal;
}