package com.sanmarcos.ventas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BoletaResponse {

    private Integer id;
    private Integer usuarioId;
    private LocalDateTime fecha;
    private Double total;
    private Boolean estado;
}