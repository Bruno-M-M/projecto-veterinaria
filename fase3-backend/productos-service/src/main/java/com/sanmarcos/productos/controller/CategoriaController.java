package com.sanmarcos.productos.controller;

import com.sanmarcos.productos.dto.CategoriaRequest;
import com.sanmarcos.productos.dto.CategoriaResponse;
import com.sanmarcos.productos.service.CategoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categorias")
@Tag(name = "Categorías", description = "Crear, consultar, editar y eliminar categorías")
public class CategoriaController {

    private final CategoriaService servicio;

    public CategoriaController(CategoriaService servicio) {
        this.servicio = servicio;
    }

    @Operation(summary = "Lista todas las categorías.")
    @GetMapping
    public List<CategoriaResponse> listar() {
        return servicio.getCategorias();
    }

    @Operation(summary = "Obtiene una categoría por su ID")
    @GetMapping("/{id}")
    public CategoriaResponse obtener(@PathVariable Long id) {
        return servicio.getCategoriaId(id);
    }

    @Operation(summary = "Crea una categoría (409 si el nombre ya existe)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoriaResponse crear(@Valid @RequestBody CategoriaRequest request) {
        return servicio.createCategoria(request);
    }

    @Operation(summary = "Actualiza una categoría por su ID")
    @PutMapping("/{id}")
    public CategoriaResponse actualizar(@PathVariable Long id, @Valid @RequestBody CategoriaRequest request) {
        return servicio.updateCategoria(id, request);
    }

    @Operation(summary = "Elimina una categoría (409 si tiene productos)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void borrar(@PathVariable Long id) {
        servicio.deleteCategoria(id);
    }
}
