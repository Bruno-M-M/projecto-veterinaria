package com.sanmarcos.ventas.service;

import com.sanmarcos.ventas.client.ProductoClient;
import com.sanmarcos.ventas.client.ProductoInfo;
import com.sanmarcos.ventas.dto.BoletaRequest;
import com.sanmarcos.ventas.dto.BoletaResponse;
import com.sanmarcos.ventas.dto.ItemBoletaRequest;
import com.sanmarcos.ventas.exception.ConflictoException;
import com.sanmarcos.ventas.exception.ResourceNotFoundException;
import com.sanmarcos.ventas.exception.ServicioExternoException;
import com.sanmarcos.ventas.exception.StockInsuficienteException;
import com.sanmarcos.ventas.model.Boleta;
import com.sanmarcos.ventas.model.DetalleBoleta;
import com.sanmarcos.ventas.repository.BoletaRepository;
import com.sanmarcos.ventas.repository.DetalleBoletaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BoletaServiceTest {

    @Mock BoletaRepository boletaRepository;
    @Mock DetalleBoletaRepository detalleRepository;
    @Mock ProductoClient productoClient;
    @InjectMocks BoletaService servicio;

    private BoletaRequest carrito(ItemBoletaRequest... items) {
        return new BoletaRequest(List.of(items));
    }

    private Boleta boletaConEstado(boolean pagada) {
        Boleta b = new Boleta();
        b.setId(5);
        b.setUsuarioId(7);
        b.setTotal(9400.0);
        b.setEstado(pagada);
        return b;
    }

    private DetalleBoleta detalle(int productoId, int cantidad) {
        DetalleBoleta d = new DetalleBoleta();
        d.setProductoId(productoId);
        d.setCantidad(cantidad);
        d.setPrecioUnitario(1000.0);
        d.setSubtotal(1000.0 * cantidad);
        return d;
    }

    // ---------- crear ----------

    @Test
    void crear_conStockSuficiente_calculaElTotalYDescuentaTodoElCarritoDeUnaVez() {
        when(productoClient.obtener(1)).thenReturn(new ProductoInfo(1, "Amoxibay", 4200.0, 10));
        when(productoClient.obtener(2)).thenReturn(new ProductoInfo(2, "Bravecto", 1000.0, 5));
        when(boletaRepository.save(any(Boleta.class))).thenAnswer(i -> i.getArgument(0));
        when(detalleRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        BoletaRequest pedido = carrito(new ItemBoletaRequest(1, 2), new ItemBoletaRequest(2, 1));

        BoletaResponse respuesta = servicio.crear(pedido, 7);

        assertEquals(9400.0, respuesta.getTotal());
        assertEquals("PAGADA", respuesta.getEstado());
        assertEquals(7, respuesta.getUsuarioId());
        assertEquals(2, respuesta.getDetalles().size());
        verify(productoClient).descontarLote(pedido.getItems());
    }

    @Test
    void crear_conStockInsuficiente_lanzaConflictoYNoGuardaNiDescuentaNada() {
        when(productoClient.obtener(1)).thenReturn(new ProductoInfo(1, "Amoxibay", 4200.0, 1));

        assertThrows(StockInsuficienteException.class,
                () -> servicio.crear(carrito(new ItemBoletaRequest(1, 5)), 7));

        verify(boletaRepository, never()).save(any());
        verify(productoClient, never()).descontarLote(any());
    }

    @Test
    void crear_guardaElPrecioDelMomentoEnCadaDetalle() {
        when(productoClient.obtener(1)).thenReturn(new ProductoInfo(1, "Amoxibay", 4200.0, 10));
        when(boletaRepository.save(any(Boleta.class))).thenAnswer(i -> i.getArgument(0));
        when(detalleRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        servicio.crear(carrito(new ItemBoletaRequest(1, 3)), 7);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<DetalleBoleta>> captor = ArgumentCaptor.forClass(List.class);
        verify(detalleRepository).saveAll(captor.capture());
        DetalleBoleta guardado = captor.getValue().get(0);
        assertEquals(4200.0, guardado.getPrecioUnitario());
        assertEquals(12600.0, guardado.getSubtotal());
    }

    @Test
    void crear_siElPrecioCambiaDespues_laBoletaNuevaUsaElPrecioNuevoYLaAnteriorConservaElSuyo() {
        when(boletaRepository.save(any(Boleta.class))).thenAnswer(i -> i.getArgument(0));
        when(detalleRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        when(productoClient.obtener(1)).thenReturn(new ProductoInfo(1, "Amoxibay", 4200.0, 10));
        BoletaResponse primera = servicio.crear(carrito(new ItemBoletaRequest(1, 1)), 7);

        when(productoClient.obtener(1)).thenReturn(new ProductoInfo(1, "Amoxibay", 5000.0, 9));
        BoletaResponse segunda = servicio.crear(carrito(new ItemBoletaRequest(1, 1)), 7);

        assertEquals(4200.0, primera.getTotal());
        assertEquals(4200.0, primera.getDetalles().get(0).getPrecioUnitario());
        assertEquals(5000.0, segunda.getTotal());
    }

    @Test
    void crear_siProductosRechazaElDescuento_propagaElErrorSinReponerNada() {
        when(productoClient.obtener(1)).thenReturn(new ProductoInfo(1, "Amoxibay", 4200.0, 10));
        when(boletaRepository.save(any(Boleta.class))).thenAnswer(i -> i.getArgument(0));
        when(detalleRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));
        doThrow(new StockInsuficienteException("sin stock"))
                .when(productoClient).descontarLote(any());

        assertThrows(StockInsuficienteException.class,
                () -> servicio.crear(carrito(new ItemBoletaRequest(1, 2)), 7));

        verify(productoClient, never()).reponerStock(anyInt(), anyInt());
    }

    @Test
    void crear_conProductoInexistente_lanzaNoEncontrado() {
        when(productoClient.obtener(99)).thenThrow(new ResourceNotFoundException("no existe"));

        assertThrows(ResourceNotFoundException.class,
                () -> servicio.crear(carrito(new ItemBoletaRequest(99, 1)), 7));

        verify(boletaRepository, never()).save(any());
    }

    // ---------- anular ----------

    @Test
    void anular_marcaLaBoletaComoAnuladaYReponeElStockDeCadaDetalle() {
        Boleta boleta = boletaConEstado(true);
        when(boletaRepository.findById(5)).thenReturn(Optional.of(boleta));
        when(detalleRepository.findByBoletaId(5)).thenReturn(List.of(detalle(1, 2), detalle(2, 1)));

        BoletaResponse respuesta = servicio.anular(5);

        assertEquals("ANULADA", respuesta.getEstado());
        verify(productoClient).reponerStock(1, 2);
        verify(productoClient).reponerStock(2, 1);
    }

    @Test
    void anular_conBoletaYaAnulada_lanzaConflictoYNoRepone() {
        when(boletaRepository.findById(5)).thenReturn(Optional.of(boletaConEstado(false)));

        assertThrows(ConflictoException.class, () -> servicio.anular(5));

        verify(productoClient, never()).reponerStock(anyInt(), anyInt());
    }

    @Test
    void anular_conBoletaInexistente_lanzaNoEncontrado() {
        when(boletaRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> servicio.anular(99));
    }

    @Test
    void anular_siFallaLaReposicionDelSegundoProducto_devuelveLoYaRepuesto() {
        Boleta boleta = boletaConEstado(true);
        when(boletaRepository.findById(5)).thenReturn(Optional.of(boleta));
        when(detalleRepository.findByBoletaId(5)).thenReturn(List.of(detalle(1, 2), detalle(2, 1)));
        doNothing().when(productoClient).reponerStock(1, 2);
        doThrow(new ServicioExternoException("productos caido"))
                .when(productoClient).reponerStock(2, 1);

        assertThrows(ServicioExternoException.class, () -> servicio.anular(5));

        // el producto 1 ya se había repuesto: se vuelve a descontar para no inflar el inventario
        verify(productoClient).descontarStock(1, 2);
        verify(productoClient, never()).descontarStock(2, 1);
    }
}
