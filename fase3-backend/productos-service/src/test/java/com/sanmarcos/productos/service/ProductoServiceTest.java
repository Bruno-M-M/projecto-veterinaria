package com.sanmarcos.productos.service;

import com.sanmarcos.productos.dto.ItemDescuentoRequest;
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
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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

    @Test
    void descontarLote_conStockSuficiente_descuentaTodosLosProductos() {
        Producto a = productoConStock(10);
        Producto b = productoConStock(5);
        when(productos.buscarParaActualizar(1L)).thenReturn(Optional.of(a));
        when(productos.buscarParaActualizar(2L)).thenReturn(Optional.of(b));
        when(productos.save(any(Producto.class))).thenAnswer(i -> i.getArgument(0));

        List<ProductoResponse> respuesta = servicio.descontarLote(List.of(
                new ItemDescuentoRequest(1L, 3), new ItemDescuentoRequest(2L, 5)));

        assertEquals(2, respuesta.size());
        assertEquals(7, a.getStock());
        assertEquals(0, b.getStock());
    }

    @Test
    void descontarLote_siUnProductoNoAlcanza_lanzaConflictoYNoCambiaNingunStock() {
        Producto a = productoConStock(10);
        Producto b = productoConStock(1);
        when(productos.buscarParaActualizar(1L)).thenReturn(Optional.of(a));
        when(productos.buscarParaActualizar(2L)).thenReturn(Optional.of(b));

        assertThrows(ConflictoException.class, () -> servicio.descontarLote(List.of(
                new ItemDescuentoRequest(1L, 3), new ItemDescuentoRequest(2L, 4))));

        assertEquals(10, a.getStock());
        assertEquals(1, b.getStock());
        verify(productos, never()).save(any());
    }

    @Test
    void descontarLote_conProductoInexistente_lanzaNoEncontradoYNoGuardaNada() {
        Producto a = productoConStock(10);
        when(productos.buscarParaActualizar(1L)).thenReturn(Optional.of(a));
        when(productos.buscarParaActualizar(99L)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> servicio.descontarLote(List.of(
                new ItemDescuentoRequest(1L, 3), new ItemDescuentoRequest(99L, 1))));

        assertEquals(10, a.getStock());
        verify(productos, never()).save(any());
    }

    @Test
    void descontarLote_conProductoDesactivado_lanzaConflictoYNoCambiaNingunStock() {
        Producto a = productoConStock(10);
        Producto b = productoConStock(10);
        b.setActivo(false);
        when(productos.buscarParaActualizar(1L)).thenReturn(Optional.of(a));
        when(productos.buscarParaActualizar(2L)).thenReturn(Optional.of(b));

        ConflictoException ex = assertThrows(ConflictoException.class, () -> servicio.descontarLote(List.of(
                new ItemDescuentoRequest(1L, 1), new ItemDescuentoRequest(2L, 1))));

        assertTrue(ex.getMessage().contains("desactivado"));
        assertEquals(10, a.getStock());
        verify(productos, never()).save(any());
    }

    @Test
    void descontarLote_conElMismoProductoRepetido_sumaLasCantidades() {
        Producto a = productoConStock(10);
        when(productos.buscarParaActualizar(1L)).thenReturn(Optional.of(a));
        when(productos.save(any(Producto.class))).thenAnswer(i -> i.getArgument(0));

        servicio.descontarLote(List.of(new ItemDescuentoRequest(1L, 2), new ItemDescuentoRequest(1L, 3)));

        assertEquals(5, a.getStock());
        verify(productos, times(1)).buscarParaActualizar(1L);
    }

    @Test
    void descontarLote_conLasSumasRepetidasQueNoAlcanzan_lanzaConflicto() {
        Producto a = productoConStock(4);
        when(productos.buscarParaActualizar(1L)).thenReturn(Optional.of(a));

        assertThrows(ConflictoException.class, () -> servicio.descontarLote(List.of(
                new ItemDescuentoRequest(1L, 2), new ItemDescuentoRequest(1L, 3))));

        assertEquals(4, a.getStock());
    }

    @Test
    void descontarLote_bloqueaLosProductosEnOrdenDeId() {
        Producto a = productoConStock(10);
        Producto b = productoConStock(10);
        when(productos.buscarParaActualizar(1L)).thenReturn(Optional.of(a));
        when(productos.buscarParaActualizar(2L)).thenReturn(Optional.of(b));
        when(productos.save(any(Producto.class))).thenAnswer(i -> i.getArgument(0));

        servicio.descontarLote(List.of(new ItemDescuentoRequest(2L, 1), new ItemDescuentoRequest(1L, 1)));

        InOrder orden = inOrder(productos);
        orden.verify(productos).buscarParaActualizar(1L);
        orden.verify(productos).buscarParaActualizar(2L);
    }
}