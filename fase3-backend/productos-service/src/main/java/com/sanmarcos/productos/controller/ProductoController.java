package com.sanmarcos.productos.controller;

import com.sanmarcos.productos.dto.CantidadRequest;
import com.sanmarcos.productos.dto.ProductoRequest;
import com.sanmarcos.productos.dto.ProductoResponse;
import com.sanmarcos.productos.service.ProductoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/productos")
@Tag(name = "Productos", description = "Crear, consultar, editar y eliminar productos")
public class ProductoController {

    private final ProductoService servicio;

    public ProductoController(ProductoService servicio) { this.servicio = servicio; }

    @Operation(summary = "Lista todos los productos")
    @GetMapping
    public List<ProductoResponse> listar(@RequestParam(required = false) Long categoriaId) {
        return servicio.getProductos(categoriaId);
    }

    @Operation(summary = "Obtiene un producto por su ID")
    @GetMapping("/{id}")
    public ProductoResponse obtener(@PathVariable Long id) { return servicio.getProductoId(id); }

    @Operation(summary = "Crea un producto (409 si el código ya existe)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoResponse crear(@Valid @RequestBody ProductoRequest request) {
        return servicio.createProducto(request);
    }

    @Operation(summary = "Actualiza un producto por su ID")
    @PutMapping("/{id}")
    public ProductoResponse actualizar(@PathVariable Long id, @Valid @RequestBody ProductoRequest request) {
        return servicio.updateProducto(id, request);
    }

    @Operation(summary = "Elimina un producto")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void borrar(@PathVariable Long id) { servicio.deleteProducto(id); }

    @Operation(summary = "Obtiene un producto por su código")
    @GetMapping("/codigo/{codigo}")
    public ProductoResponse obtenerPorCodigo(@PathVariable String codigo) {
        return servicio.getProductoCodigo(codigo);
    }

    @Operation(summary = "Lista los productos con stock crítico")
    @GetMapping("/stock-critico")
    public List<ProductoResponse> stockCritico() {
        return servicio.getStockCritico();
    }

    @Operation(summary = "Descuenta del stock la cantidad comprada (409 si no alcanza)")
    @PostMapping("/{id}/descontar")
    public ProductoResponse descontar(@PathVariable Long id, @Valid @RequestBody CantidadRequest request) {
        return servicio.descontarStock(id, request.getCantidad());
    }

    @Operation(summary = "Repone una cantidad al stock")
    @PostMapping("/{id}/reponer")
    public ProductoResponse reponer(@PathVariable Long id, @Valid @RequestBody CantidadRequest request) {
        return servicio.reponerStock(id, request.getCantidad());
    }
}
