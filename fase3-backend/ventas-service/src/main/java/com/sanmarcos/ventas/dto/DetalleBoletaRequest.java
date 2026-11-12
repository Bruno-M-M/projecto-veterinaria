package com.sanmarcos.ventas.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DetalleBoletaRequest {

    @NotNull(message = "El ID de la boleta es obligatorio")
    private Integer boletaId;

    @NotNull(message = "El ID del producto es obligatorio")
    private Integer productoId;

    @NotNull(message = "La cantidad es obligatoria")
    @Positive(message = "La cantidad debe ser mayor a 0")
    private Integer cantidad;

    @NotNull(message = "El precio unitario es obligatorio")
    @Positive(message = "El precio unitario debe ser positivo")
    private Double precioUnitario;

    @NotNull(message = "El subtotal es obligatorio")
    @Positive(message = "El subtotal debe ser positivo")
    private Double subtotal;
}