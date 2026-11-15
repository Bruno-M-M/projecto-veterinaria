package com.sanmarcos.productos.controller;

import com.sanmarcos.productos.dto.CategoriaResponse;
import com.sanmarcos.productos.exception.ConflictoException;
import com.sanmarcos.productos.exception.RecursoNoEncontradoException;
import com.sanmarcos.productos.security.JwtService;
import com.sanmarcos.productos.security.SecurityConfig;
import com.sanmarcos.productos.security.TokenDePrueba;
import com.sanmarcos.productos.service.CategoriaService;
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

@WebMvcTest(CategoriaController.class)
@Import({SecurityConfig.class, JwtService.class})
@TestPropertySource(properties = {
        "jwt.secret=" + TokenDePrueba.SECRETO,
        "cors.origins=http://localhost:5173"})
public class CategoriaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CategoriaService servicio;

    private static final String CATEGORIA_VALIDA = "{\"nombre\":\"Antibioticos\"}";

    private String bearer(String rol) {
        return "Bearer " + TokenDePrueba.acceso(rol);
    }

    @Test
    void listar_sinToken_responde200() throws Exception {
        when(servicio.getCategorias()).thenReturn(List.of(new CategoriaResponse(1L, "Antibioticos")));

        mockMvc.perform(get("/api/v1/categorias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Antibioticos"));
    }

    @Test
    void obtener_conIdExistente_responde200() throws Exception {
        when(servicio.getCategoriaId(1L)).thenReturn(new CategoriaResponse(1L, "Antibioticos"));

        mockMvc.perform(get("/api/v1/categorias/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void obtener_conIdInexistente_responde404() throws Exception {
        when(servicio.getCategoriaId(99L))
                .thenThrow(new RecursoNoEncontradoException("No existe la categoria con id 99."));

        mockMvc.perform(get("/api/v1/categorias/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje").value("No existe la categoria con id 99."));
    }

    @Test
    void crear_comoAdministrador_responde201() throws Exception {
        when(servicio.createCategoria(any())).thenReturn(new CategoriaResponse(1L, "Antibioticos"));

        mockMvc.perform(post("/api/v1/categorias")
                        .header("Authorization", bearer("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CATEGORIA_VALIDA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Antibioticos"));
    }

    @Test
    void crear_sinToken_responde401() throws Exception {
        mockMvc.perform(post("/api/v1/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CATEGORIA_VALIDA))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(servicio);
    }

    @Test
    void crear_conTokenVencido_responde401() throws Exception {
        mockMvc.perform(post("/api/v1/categorias")
                        .header("Authorization", "Bearer " + TokenDePrueba.vencido("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CATEGORIA_VALIDA))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void crear_comoVendedor_responde403() throws Exception {
        mockMvc.perform(post("/api/v1/categorias")
                        .header("Authorization", bearer("VENDEDOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CATEGORIA_VALIDA))
                .andExpect(status().isForbidden());

        verifyNoInteractions(servicio);
    }

    @Test
    void crear_sinNombre_responde400ConElCampo() throws Exception {
        mockMvc.perform(post("/api/v1/categorias")
                        .header("Authorization", bearer("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.nombre").exists());
    }

    @Test
    void crear_conNombreRepetido_responde409() throws Exception {
        when(servicio.createCategoria(any()))
                .thenThrow(new ConflictoException("Ya existe una categoria con ese nombre."));

        mockMvc.perform(post("/api/v1/categorias")
                        .header("Authorization", bearer("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CATEGORIA_VALIDA))
                .andExpect(status().isConflict());
    }

    @Test
    void actualizar_comoAdministrador_responde200() throws Exception {
        when(servicio.updateCategoria(any(), any())).thenReturn(new CategoriaResponse(1L, "Vacunas"));

        mockMvc.perform(put("/api/v1/categorias/1")
                        .header("Authorization", bearer("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Vacunas\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Vacunas"));
    }

    @Test
    void actualizar_comoCliente_responde403() throws Exception {
        mockMvc.perform(put("/api/v1/categorias/1")
                        .header("Authorization", bearer("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Vacunas\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void borrar_comoAdministrador_responde204() throws Exception {
        mockMvc.perform(delete("/api/v1/categorias/1")
                        .header("Authorization", bearer("ADMINISTRADOR")))
                .andExpect(status().isNoContent());

        verify(servicio).deleteCategoria(1L);
    }

    @Test
    void borrar_conProductos_responde409() throws Exception {
        org.mockito.Mockito.doThrow(new ConflictoException("La categoria tiene productos."))
                .when(servicio).deleteCategoria(1L);

        mockMvc.perform(delete("/api/v1/categorias/1")
                        .header("Authorization", bearer("ADMINISTRADOR")))
                .andExpect(status().isConflict());
    }

    @Test
    void borrar_comoVendedor_responde403() throws Exception {
        mockMvc.perform(delete("/api/v1/categorias/1")
                        .header("Authorization", bearer("VENDEDOR")))
                .andExpect(status().isForbidden());

        verifyNoInteractions(servicio);
    }
}