package com.sanmarcos.productos.service;

import com.sanmarcos.productos.dto.CategoriaRequest;
import com.sanmarcos.productos.dto.CategoriaResponse;
import com.sanmarcos.productos.exception.ConflictoException;
import com.sanmarcos.productos.exception.RecursoNoEncontradoException;
import com.sanmarcos.productos.model.Categoria;
import com.sanmarcos.productos.repository.CategoriaRepository;
import com.sanmarcos.productos.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoriaService {

    private final CategoriaRepository categorias;
    private final ProductoRepository productos;

    private CategoriaResponse categoriaResponse(Categoria categoria) {
        return new CategoriaResponse(categoria.getId(), categoria.getNombre());
    }

    public CategoriaService(CategoriaRepository categorias, ProductoRepository productos) {

        this.categorias = categorias;
        this.productos = productos;
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> getCategorias() {
        return categorias.findAll()
                .stream()
                .map(this::categoriaResponse)
                .toList();
    }

    private Categoria getCategoriaById(Long id) {
        return categorias.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe la categoria con id " + id + "."
                ));
    }

    @Transactional(readOnly = true)
    public CategoriaResponse getCategoriaId(Long id) {
        return categoriaResponse(getCategoriaById(id));
    }

    @Transactional
    public CategoriaResponse createCategoria(CategoriaRequest nueva) {
        String nombre = nueva.getNombre().trim();
        if (categorias.existsByNombre(nombre)) {
            throw new ConflictoException("Ya existe la categoria " + nombre + ".");
        }
        Categoria categoria = new Categoria();
        categoria.setNombre(nombre);
        return categoriaResponse(categorias.save(categoria));
    }

    @Transactional
    public CategoriaResponse updateCategoria(Long id, CategoriaRequest update) {
        Categoria antiguo = getCategoriaById(id);
        String nombre = update.getNombre().trim();

        if (!antiguo.getNombre().equals(nombre) && categorias.existsByNombre(nombre)) {
            throw new ConflictoException("Ya existe la categoria " + nombre + ".");
        }

        antiguo.setNombre(nombre);
        return categoriaResponse(categorias.save(antiguo));
    }

    @Transactional
    public void deleteCategoria(Long id) {
        Categoria categoria = getCategoriaById(id);
        if (productos.existsByCategoriaId(id)) {
            throw new ConflictoException("No se puede eliminar: la categoria tiene productos.");
        }
        categorias.delete(categoria);
    }
}
