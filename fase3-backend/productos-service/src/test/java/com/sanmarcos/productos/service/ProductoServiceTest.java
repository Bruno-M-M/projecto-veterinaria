package com.sanmarcos.productos.service;

import com.sanmarcos.productos.dto.ProductoRequest;
import com.sanmarcos.productos.dto.ProductoResponse;
import com.sanmarcos.productos.exception.ConflictoException;
import com.sanmarcos.productos.exception.RecursoNoEncontradoException;
import com.sanmarcos.productos.model.Categoria;
import com.sanmarcos.productos.model.Producto;
import com.sanmarcos.productos.repository.CategoriaRepository;
import com.sanmarcos.productos.repository.ProductoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ProductoServiceTest {

    @Mock
    private ProductoRepository productos;

    @Mock
    private CategoriaRepository categorias;

    @InjectMocks
    private ProductoService servicio;

    private Producto productoConStock(int stock) {
        Producto p = new Producto();
        p.setNombre("Bravecto");
        p.setStock(stock);
        p.setCategoria(new Categoria("Antiparasitarios", 1L));
        return p;
    }

    private ProductoRequest requestConCategoria(Long categoriaId) {
        return new ProductoRequest(
                "ME001", "Amoxibay", "Antibiotico", 4200, 45, 10, true, categoriaId);
    }

    @Test
    void descontarStock_conStockSuficiente_restaLaCantidad() {
        Producto p = productoConStock(10);
        when(productos.buscarParaActualizar(1L)).thenReturn(Optional.of(p));
        when(productos.save(p)).thenReturn(p);

        ProductoResponse respuesta = servicio.descontarStock(1L, 3);

        assertEquals(7, respuesta.getStock());
    }

    @Test
    void descontarStock_conStockInsuficiente_lanzaConflicto() {
        Producto p = productoConStock(2);
        when(productos.buscarParaActualizar(1L)).thenReturn(Optional.of(p));

        assertThrows(ConflictoException.class, () -> servicio.descontarStock(1L, 5));
    }

    @Test
    void descontarStock_conProductoInexistente_lanzaNoEncontrado() {
        when(productos.buscarParaActualizar(99L)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> servicio.descontarStock(99L, 1));
    }

    @Test
    void descontarStock_conProductoDesactivado_lanzaConflictoYNoCambiaElStock() {
        Producto p = productoConStock(10);
        p.setActivo(false);
        when(productos.buscarParaActualizar(1L)).thenReturn(Optional.of(p));

        ConflictoException error = assertThrows(ConflictoException.class, () -> servicio.descontarStock(1L, 3));

        assertTrue(error.getMessage().contains("desactivado"));
        assertEquals(10, p.getStock());
        verify(productos, never()).save(any());
    }

    @Test
    void descontarStock_conProductoDesactivadoYSinStock_avisaQueEstaDesactivado() {
        Producto p = productoConStock(0);
        p.setActivo(false);
        when(productos.buscarParaActualizar(1L)).thenReturn(Optional.of(p));

        ConflictoException error = assertThrows(ConflictoException.class, () -> servicio.descontarStock(1L, 1));

        assertTrue(error.getMessage().contains("desactivado"));
    }

    @Test
    void reponerStock_conProductoDesactivado_igualAumentaElStock() {
        Producto p = productoConStock(5);
        p.setActivo(false);
        when(productos.buscarParaActualizar(1L)).thenReturn(Optional.of(p));
        when(productos.save(p)).thenReturn(p);

        ProductoResponse respuesta = servicio.reponerStock(1L, 4);

        assertEquals(9, respuesta.getStock());
    }

    @Test
    void reponerStock_aumentaElStock() {
        Producto p = productoConStock(5);
        when(productos.buscarParaActualizar(1L)).thenReturn(Optional.of(p));
        when(productos.save(p)).thenReturn(p);

        ProductoResponse respuesta = servicio.reponerStock(1L, 4);

        assertEquals(9, respuesta.getStock());
    }

    @Test
    void createProducto_conCodigoRepetido_lanzaConflicto() {
        when(productos.existsByCodigo("ME001")).thenReturn(true);

        assertThrows(ConflictoException.class, () -> servicio.createProducto(requestConCategoria(1L)));
    }

    @Test
    void createProducto_conCategoriaInexistente_lanzaNoEncontrado() {
        when(categorias.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> servicio.createProducto(requestConCategoria(99L)));
    }
}