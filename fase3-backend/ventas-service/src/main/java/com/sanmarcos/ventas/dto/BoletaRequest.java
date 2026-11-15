package com.sanmarcos.ventas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoletaRequest {

    @NotEmpty(message = "La compra debe tener al menos un producto")
    @Valid
    private List<ItemBoletaRequest> items;
}