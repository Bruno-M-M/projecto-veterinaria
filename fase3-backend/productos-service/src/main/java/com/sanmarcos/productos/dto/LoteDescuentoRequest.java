package com.sanmarcos.productos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class LoteDescuentoRequest {

    @NotEmpty(message = "Debe haber al menos un producto.")
    @Valid
    private List<ItemDescuentoRequest> items;

    public LoteDescuentoRequest() {
    }

    public LoteDescuentoRequest(List<ItemDescuentoRequest> items) {
        this.items = items;
    }

    public List<ItemDescuentoRequest> getItems() {
        return items;
    }

    public void setItems(List<ItemDescuentoRequest> items) {
        this.items = items;
    }
}