package com.sanmarcos.ventas.controller;

import com.sanmarcos.ventas.dto.BoletaResponse;
import com.sanmarcos.ventas.exception.ConflictoException;
import com.sanmarcos.ventas.exception.ServicioExternoException;
import com.sanmarcos.ventas.exception.StockInsuficienteException;
import com.sanmarcos.ventas.security.JwtService;
import com.sanmarcos.ventas.security.SecurityConfig;
import com.sanmarcos.ventas.security.TokenDePrueba;
import com.sanmarcos.ventas.service.BoletaService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BoletaController.class)
@Import({SecurityConfig.class, JwtService.class})
@TestPropertySource(properties = {
        "jwt.secret=" + TokenDePrueba.SECRETO,
        "cors.origins=http://localhost:5173"})
class BoletaControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean BoletaService servicio;

    private static final String COMPRA = "{\"items\":[{\"productoId\":1,\"cantidad\":2}]}";

    private String bearer(String rol) {
        return "Bearer " + TokenDePrueba.acceso(rol);
    }

    private BoletaResponse boleta(String estado) {
        return BoletaResponse.builder().id(5).usuarioId(7).total(9400.0).estado(estado).build();
    }

    // ---------- comprar ----------

    @Test
    void comprar_comoCliente_responde201YTomaElCompradorDelToken() throws Exception {
        when(servicio.crear(any(), eq(7))).thenReturn(boleta("PAGADA"));

        mvc.perform(post("/api/v1/boletas")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(COMPRA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("PAGADA"));

        verify(servicio).crear(any(), eq(7)); // el 7 es el subject del token
    }

    @Test
    void comprar_sinToken_responde401() throws Exception {
        mvc.perform(post("/api/v1/boletas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(COMPRA))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(servicio);
    }

    @Test
    void comprar_conTokenVencido_responde401() throws Exception {
        mvc.perform(post("/api/v1/boletas")
                        .header("Authorization", "Bearer " + TokenDePrueba.vencido("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(COMPRA))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void comprar_comoVendedor_responde403() throws Exception {
        mvc.perform(post("/api/v1/boletas")
                        .header("Authorization", bearer("VENDEDOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(COMPRA))
                .andExpect(status().isForbidden());

        verifyNoInteractions(servicio);
    }

    @Test
    void comprar_sinProductos_responde400() throws Exception {
        mvc.perform(post("/api/v1/boletas")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void comprar_sinStock_responde409() throws Exception {
        when(servicio.crear(any(), any()))
                .thenThrow(new StockInsuficienteException("Stock insuficiente"));

        mvc.perform(post("/api/v1/boletas")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(COMPRA))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value("Stock insuficiente"));
    }

    @Test
    void comprar_siProductosNoResponde_responde502() throws Exception {
        when(servicio.crear(any(), any()))
                .thenThrow(new ServicioExternoException("No se pudo conectar con productos-service"));

        mvc.perform(post("/api/v1/boletas")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(COMPRA))
                .andExpect(status().isBadGateway());
    }

    // ---------- ver órdenes ----------

    @Test
    void listar_comoVendedor_responde200() throws Exception {
        when(servicio.listarTodas()).thenReturn(List.of(boleta("PAGADA")));

        mvc.perform(get("/api/v1/boletas").header("Authorization", bearer("VENDEDOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(5));
    }

    @Test
    void listar_comoCliente_responde403() throws Exception {
        mvc.perform(get("/api/v1/boletas").header("Authorization", bearer("CLIENTE")))
                .andExpect(status().isForbidden());

        verifyNoInteractions(servicio);
    }

    @Test
    void listar_sinToken_responde401() throws Exception {
        mvc.perform(get("/api/v1/boletas")).andExpect(status().isUnauthorized());
    }

    @Test
    void detalle_comoAdministrador_responde200() throws Exception {
        when(servicio.obtenerPorId(5)).thenReturn(boleta("PAGADA"));

        mvc.perform(get("/api/v1/boletas/5").header("Authorization", bearer("ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    // ---------- anular ----------

    @Test
    void anular_comoAdministrador_responde200() throws Exception {
        when(servicio.anular(5)).thenReturn(boleta("ANULADA"));

        mvc.perform(patch("/api/v1/boletas/5/anular")
                        .header("Authorization", bearer("ADMINISTRADOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("ANULADA"));
    }

    @Test
    void anular_comoVendedor_responde403() throws Exception {
        mvc.perform(patch("/api/v1/boletas/5/anular")
                        .header("Authorization", bearer("VENDEDOR")))
                .andExpect(status().isForbidden());

        verifyNoInteractions(servicio);
    }

    @Test
    void anular_comoCliente_responde403() throws Exception {
        mvc.perform(patch("/api/v1/boletas/5/anular")
                        .header("Authorization", bearer("CLIENTE")))
                .andExpect(status().isForbidden());
    }

    @Test
    void anular_sinToken_responde401() throws Exception {
        mvc.perform(patch("/api/v1/boletas/5/anular")).andExpect(status().isUnauthorized());
    }

    @Test
    void anular_boletaYaAnulada_responde409() throws Exception {
        when(servicio.anular(5)).thenThrow(new ConflictoException("La boleta 5 ya está anulada"));

        mvc.perform(patch("/api/v1/boletas/5/anular")
                        .header("Authorization", bearer("ADMINISTRADOR")))
                .andExpect(status().isConflict());
    }
}
