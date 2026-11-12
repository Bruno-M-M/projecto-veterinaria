package com.sanmarcos.ventas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoletaRequest {

    // TEMPORAL: cuando exista el token de Benjamín, este campo se borra
    // y el usuario se toma del token.
    @NotNull(message = "El ID del usuario es obligatorio")
    private Integer usuarioId;

    @NotEmpty(message = "La compra debe tener al menos un producto")
    @Valid
    private List<ItemBoletaRequest> items;
}