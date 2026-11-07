package com.sanmarcos.productos.controller;

import com.sanmarcos.productos.dto.CantidadRequest;
import com.sanmarcos.productos.dto.ProductoRequest;
import com.sanmarcos.productos.dto.ProductoResponse;
import com.sanmarcos.productos.service.ProductoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/productos")
public class ProductoController {

    private final ProductoService servicio;

    public ProductoController(ProductoService servicio) { this.servicio = servicio; }

    @GetMapping
    public List<ProductoResponse> listar(@RequestParam(required = false) Long categoriaId) {
        return servicio.getProductos(categoriaId);
    }

    @GetMapping("/{id}")
    public ProductoResponse obtener(@PathVariable Long id) { return servicio.getProductoId(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoResponse crear(@Valid @RequestBody ProductoRequest request) {
        return servicio.createProducto(request);
    }

    @PutMapping("/{id}")
    public ProductoResponse actualizar(@PathVariable Long id, @Valid @RequestBody ProductoRequest request) {
        return servicio.updateProducto(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void borrar(@PathVariable Long id) { servicio.deleteProducto(id); }

    @GetMapping("/codigo/{codigo}")
    public ProductoResponse obtenerPorCodigo(@PathVariable String codigo) {
        return servicio.getProductoCodigo(codigo);
    }

    @GetMapping("/stock-critico")
    public List<ProductoResponse> stockCritico() {
        return servicio.getStockCritico();
    }

    @PostMapping("/{id}/descontar")
    public ProductoResponse descontar(@PathVariable Long id, @Valid @RequestBody CantidadRequest request) {
        return servicio.descontarStock(id, request.getCantidad());
    }

    @PostMapping("/{id}/reponer")
    public ProductoResponse reponer(@PathVariable Long id, @Valid @RequestBody CantidadRequest request) {
        return servicio.reponerStock(id, request.getCantidad());
    }
}
