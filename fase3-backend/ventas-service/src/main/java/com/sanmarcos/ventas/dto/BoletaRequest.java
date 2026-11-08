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
public class BoletaRequest {

    @NotNull(message = "El ID del usuario es obligatorio")
    private Integer usuarioId;

    @NotNull(message = "El total es obligatorio")
    @Positive(message = "El total debe ser un valor positivo")
    private Double total;

    @NotNull(message = "El estado es obligatorio")
    private Boolean estado;
}