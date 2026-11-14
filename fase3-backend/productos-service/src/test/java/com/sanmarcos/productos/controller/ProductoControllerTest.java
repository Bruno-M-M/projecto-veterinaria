package com.sanmarcos.productos.controller;

import com.sanmarcos.productos.dto.ProductoResponse;
import com.sanmarcos.productos.exception.ConflictoException;
import com.sanmarcos.productos.exception.RecursoNoEncontradoException;
import com.sanmarcos.productos.security.JwtService;
import com.sanmarcos.productos.security.SecurityConfig;
import com.sanmarcos.productos.security.TokenDePrueba;
import com.sanmarcos.productos.service.ProductoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
        import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductoController.class)
@Import({SecurityConfig.class, JwtService.class})
@TestPropertySource(properties = {
        "jwt.secret=" + TokenDePrueba.SECRETO,
        "cors.origins=http://localhost:5173"})
public class ProductoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductoService servicio;

    private static final String PRODUCTO_VALIDO = """
            {"codigo":"ME001","nombre":"Amoxibay","descripcion":"Antibiotico",
             "precio":4200,"stock":45,"stockCritico":10,"activo":true,"categoriaId":1}
            """;

    private ProductoResponse respuesta() {
        return new ProductoResponse(1L, "ME001", "Amoxibay", "Antibiotico",
                4200, 45, 10, true, 1L, "Antibioticos");
    }

    private String bearer(String rol) {
        return "Bearer " + TokenDePrueba.acceso(rol);
    }

    @Test
    void listar_sinToken_responde200() throws Exception {
        when(servicio.getProductos(null)).thenReturn(List.of(respuesta()));

        mockMvc.perform(get("/api/v1/productos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].codigo").value("ME001"));
    }

    @Test
    void obtener_conIdExistente_responde200() throws Exception {
        when(servicio.getProductoId(1L)).thenReturn(respuesta());

        mockMvc.perform(get("/api/v1/productos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value("ME001"));
    }

    @Test
    void obtener_conIdInexistente_responde404() throws Exception {
        when(servicio.getProductoId(99L))
                .thenThrow(new RecursoNoEncontradoException("No existe el producto con id 99."));

        mockMvc.perform(get("/api/v1/productos/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje").value("No existe el producto con id 99."));
    }

    @Test
    void obtenerPorCodigo_sinToken_responde200() throws Exception {
        when(servicio.getProductoCodigo("ME001")).thenReturn(respuesta());

        mockMvc.perform(get("/api/v1/productos/codigo/ME001"))
                .andExpect(status().isOk());
    }

    @Test
    void crear_comoAdministrador_responde201() throws Exception {
        when(servicio.createProducto(any())).thenReturn(respuesta());

        mockMvc.perform(post("/api/v1/productos")
                        .header("Authorization", bearer("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCTO_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void crear_sinToken_responde401() throws Exception {
        mockMvc.perform(post("/api/v1/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCTO_VALIDO))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.estado").value(401))
                .andExpect(jsonPath("$.mensaje").value("Se requiere un token de acceso"));

        verifyNoInteractions(servicio);
    }

    @Test
    void crear_conTokenVencido_responde401() throws Exception {
        mockMvc.perform(post("/api/v1/productos")
                        .header("Authorization", "Bearer " + TokenDePrueba.vencido("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCTO_VALIDO))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Token inválido o vencido"));

        verifyNoInteractions(servicio);
    }

    @Test
    void crear_conTokenMalformado_responde401() throws Exception {
        mockMvc.perform(post("/api/v1/productos")
                        .header("Authorization", "Bearer esto-no-es-un-jwt")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCTO_VALIDO))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void crear_conTokenDeRefresco_responde401() throws Exception {
        mockMvc.perform(post("/api/v1/productos")
                        .header("Authorization", "Bearer " + TokenDePrueba.refresco("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCTO_VALIDO))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("El token no es del tipo esperado"));
    }

    @Test
    void crear_comoVendedor_responde403() throws Exception {
        mockMvc.perform(post("/api/v1/productos")
                        .header("Authorization", bearer("VENDEDOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCTO_VALIDO))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.estado").value(403));

        verifyNoInteractions(servicio);
    }

    @Test
    void crear_comoCliente_responde403() throws Exception {
        mockMvc.perform(post("/api/v1/productos")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCTO_VALIDO))
                .andExpect(status().isForbidden());
    }

    @Test
    void crear_sinCodigo_responde400ConElCampo() throws Exception {
        String sinCodigo = PRODUCTO_VALIDO.replace("\"codigo\":\"ME001\",", "");

        mockMvc.perform(post("/api/v1/productos")
                        .header("Authorization", bearer("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sinCodigo))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.codigo").exists());
    }

    @Test
    void crear_conCodigoRepetido_responde409() throws Exception {
        when(servicio.createProducto(any()))
                .thenThrow(new ConflictoException("Ya existe un producto con el codigo ME001."));

        mockMvc.perform(post("/api/v1/productos")
                        .header("Authorization", bearer("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCTO_VALIDO))
                .andExpect(status().isConflict());
    }

    @Test
    void actualizar_comoAdministrador_responde200() throws Exception {
        when(servicio.updateProducto(any(), any())).thenReturn(respuesta());

        mockMvc.perform(put("/api/v1/productos/1")
                        .header("Authorization", bearer("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCTO_VALIDO))
                .andExpect(status().isOk());
    }

    @Test
    void actualizar_comoVendedor_responde403() throws Exception {
        mockMvc.perform(put("/api/v1/productos/1")
                        .header("Authorization", bearer("VENDEDOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCTO_VALIDO))
                .andExpect(status().isForbidden());
    }

    @Test
    void borrar_comoAdministrador_responde204() throws Exception {
        mockMvc.perform(delete("/api/v1/productos/1")
                        .header("Authorization", bearer("ADMINISTRADOR")))
                .andExpect(status().isNoContent());

        verify(servicio).deleteProducto(1L);
    }

    @Test
    void borrar_sinToken_responde401() throws Exception {
        mockMvc.perform(delete("/api/v1/productos/1"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(servicio);
    }

    @Test
    void borrar_comoCliente_responde403() throws Exception {
        mockMvc.perform(delete("/api/v1/productos/1")
                        .header("Authorization", bearer("CLIENTE")))
                .andExpect(status().isForbidden());

        verifyNoInteractions(servicio);
    }

    @Test
    void stockCritico_comoVendedor_responde200() throws Exception {
        when(servicio.getStockCritico()).thenReturn(List.of(respuesta()));

        mockMvc.perform(get("/api/v1/productos/stock-critico")
                        .header("Authorization", bearer("VENDEDOR")))
                .andExpect(status().isOk());
    }

    @Test
    void stockCritico_sinToken_responde401() throws Exception {
        mockMvc.perform(get("/api/v1/productos/stock-critico"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void stockCritico_comoCliente_responde403() throws Exception {
        mockMvc.perform(get("/api/v1/productos/stock-critico")
                        .header("Authorization", bearer("CLIENTE")))
                .andExpect(status().isForbidden());
    }

    @Test
    void descontar_comoCliente_responde200() throws Exception {
        when(servicio.descontarStock(1L, 2)).thenReturn(respuesta());

        mockMvc.perform(post("/api/v1/productos/1/descontar")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cantidad\":2}"))
                .andExpect(status().isOk());

        verify(servicio).descontarStock(1L, 2);
    }

    @Test
    void descontar_sinStock_responde409() throws Exception {
        when(servicio.descontarStock(1L, 500))
                .thenThrow(new ConflictoException("No hay stock suficiente."));

        mockMvc.perform(post("/api/v1/productos/1/descontar")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cantidad\":500}"))
                .andExpect(status().isConflict());
    }

    @Test
    void descontar_conCantidadCero_responde400() throws Exception {
        mockMvc.perform(post("/api/v1/productos/1/descontar")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cantidad\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.cantidad").exists());
    }

    @Test
    void descontar_sinToken_responde401() throws Exception {
        mockMvc.perform(post("/api/v1/productos/1/descontar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cantidad\":2}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void descontar_comoVendedor_responde403() throws Exception {
        mockMvc.perform(post("/api/v1/productos/1/descontar")
                        .header("Authorization", bearer("VENDEDOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cantidad\":2}"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(servicio);
    }

     @Test
    void reponer_comoAdministrador_responde200() throws Exception {
        when(servicio.reponerStock(1L, 5)).thenReturn(respuesta());

        mockMvc.perform(post("/api/v1/productos/1/reponer")
                        .header("Authorization", bearer("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cantidad\":5}"))
                .andExpect(status().isOk());
    }

    @Test
    void reponer_comoCliente_responde403() throws Exception {
        mockMvc.perform(post("/api/v1/productos/1/reponer")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cantidad\":5}"))
                .andExpect(status().isForbidden());
    }

    private static final String LOTE_VALIDO =
            "{\"items\":[{\"productoId\":1,\"cantidad\":2},{\"productoId\":2,\"cantidad\":1}]}";

    @Test
    void descontarLote_comoCliente_responde200() throws Exception {
        when(servicio.descontarLote(any())).thenReturn(List.of(respuesta()));

        mockMvc.perform(post("/api/v1/productos/descontar-lote")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOTE_VALIDO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].codigo").value("ME001"));
    }

    @Test
    void descontarLote_sinStock_responde409() throws Exception {
        when(servicio.descontarLote(any()))
                .thenThrow(new ConflictoException("Stock insuficiente de Amoxibay: quedan 1 unidades."));

        mockMvc.perform(post("/api/v1/productos/descontar-lote")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOTE_VALIDO))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value("Stock insuficiente de Amoxibay: quedan 1 unidades."));
    }

    @Test
    void descontarLote_conListaVacia_responde400() throws Exception {
        mockMvc.perform(post("/api/v1/productos/descontar-lote")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.items").exists());
    }

    @Test
    void descontarLote_conCantidadCero_responde400() throws Exception {
        mockMvc.perform(post("/api/v1/productos/descontar-lote")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"productoId\":1,\"cantidad\":0}]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void descontarLote_sinToken_responde401() throws Exception {
        mockMvc.perform(post("/api/v1/productos/descontar-lote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOTE_VALIDO))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(servicio);
    }

    @Test
    void descontarLote_comoVendedor_responde403() throws Exception {
        mockMvc.perform(post("/api/v1/productos/descontar-lote")
                        .header("Authorization", bearer("VENDEDOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOTE_VALIDO))
                .andExpect(status().isForbidden());

        verifyNoInteractions(servicio);
    }
}