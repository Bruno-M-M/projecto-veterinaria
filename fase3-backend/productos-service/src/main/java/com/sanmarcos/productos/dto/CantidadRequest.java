package com.sanmarcos.productos.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class CantidadRequest {

    @NotNull(message = "La cantidad es obligatoria.")
    @Positive(message = "La cantidad debe ser un numero mayor a 0.")
    private Integer cantidad;

    public CantidadRequest(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public CantidadRequest() {
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }
}
