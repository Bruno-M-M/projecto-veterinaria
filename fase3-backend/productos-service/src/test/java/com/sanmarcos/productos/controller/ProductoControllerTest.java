package com.sanmarcos.productos.controller;

import com.sanmarcos.productos.dto.ProductoResponse;
import com.sanmarcos.productos.exception.ConflictoException;
import com.sanmarcos.productos.exception.RecursoNoEncontradoException;
import com.sanmarcos.productos.service.ProductoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductoController.class)
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
    void crear_conDatosValidos_responde201() throws Exception {
        when(servicio.createProducto(any())).thenReturn(respuesta());

        mockMvc.perform(post("/api/v1/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCTO_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void crear_sinCodigo_responde400ConElCampo() throws Exception {
        String sinCodigo = PRODUCTO_VALIDO.replace("\"codigo\":\"ME001\",", "");

        mockMvc.perform(post("/api/v1/productos")
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
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PRODUCTO_VALIDO))
                .andExpect(status().isConflict());
    }

    @Test
    void borrar_responde204() throws Exception {
        mockMvc.perform(delete("/api/v1/productos/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void descontar_conCantidadCero_responde400() throws Exception {
        mockMvc.perform(post("/api/v1/productos/1/descontar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cantidad\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.cantidad").exists());
    }
}