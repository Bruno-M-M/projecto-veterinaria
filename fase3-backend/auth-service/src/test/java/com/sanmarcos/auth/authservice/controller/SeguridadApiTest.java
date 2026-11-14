package com.sanmarcos.auth.authservice.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sanmarcos.auth.authservice.exception.ConflictoException;
import com.sanmarcos.auth.authservice.exception.NoAutorizadoException;
import com.sanmarcos.auth.authservice.security.JwtService;
import com.sanmarcos.auth.authservice.security.SecurityConfig;
import com.sanmarcos.auth.authservice.security.TokenDePrueba;
import com.sanmarcos.auth.authservice.security.TokenInvalidoException;
import com.sanmarcos.auth.authservice.service.AuthService;
import com.sanmarcos.auth.authservice.service.UsuarioService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** Pruebas HTTP de seguridad y errores. No necesitan Oracle: los servicios van simulados. */
@WebMvcTest({AuthController.class, UsuarioController.class})
@Import({SecurityConfig.class, JwtService.class})
@TestPropertySource(properties = {
        "jwt.secret=clave-de-prueba-con-mas-de-32-caracteres-123",
        "cors.origins=http://localhost:5173"})
class SeguridadApiTest {

    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @MockitoBean AuthService authService;
    @MockitoBean UsuarioService usuarioService;

    private String bearer(String rol) {
        return "Bearer " + jwt.generarAcceso(1L, rol);
    }

    // ---------- /usuarios: token y permisos ----------

    @Test
    void usuariosSinTokenDa401() throws Exception {
        mvc.perform(get("/api/v1/usuarios"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.estado").value(401));
    }

    @Test
    void usuariosConTokenVencidoDa401() throws Exception {
        String vencido = TokenDePrueba.vencido("clave-de-prueba-con-mas-de-32-caracteres-123",
                1L, "ADMINISTRADOR", JwtService.TIPO_ACCESO);
        mvc.perform(get("/api/v1/usuarios").header("Authorization", "Bearer " + vencido))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void usuariosConTokenMalformadoDa401() throws Exception {
        mvc.perform(get("/api/v1/usuarios").header("Authorization", "Bearer basura"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void usuariosConTokenDeRefrescoDa401() throws Exception {
        String refresco = jwt.generarRefresco(1L, "ADMINISTRADOR");
        mvc.perform(get("/api/v1/usuarios").header("Authorization", "Bearer " + refresco))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void usuariosComoClienteDa403() throws Exception {
        mvc.perform(get("/api/v1/usuarios").header("Authorization", bearer("CLIENTE")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.estado").value(403));
    }

    @Test
    void usuariosComoTrabajadorDa403() throws Exception {
        mvc.perform(get("/api/v1/usuarios").header("Authorization", bearer("TRABAJADOR")))
                .andExpect(status().isForbidden());
    }

    @Test
    void usuariosComoAdministradorDa200() throws Exception {
        when(usuarioService.listar()).thenReturn(List.of());
        mvc.perform(get("/api/v1/usuarios").header("Authorization", bearer("ADMINISTRADOR")))
                .andExpect(status().isOk());
    }

    // ---------- /auth: rutas públicas y errores ----------

    private static final String REGISTRO_OK = """
            {"run":"12345678-5","nombres":"Ana","apellidos":"Pérez","correo":"ana@correo.cl","clave":"clave1234"}""";

    @Test
    void registroConDatosInvalidosDa400() throws Exception {
        String malo = """
                {"run":"12345678-9","nombres":"","apellidos":"P","correo":"no-es-correo","clave":"123"}""";
        mvc.perform(post("/api/v1/auth/registro").contentType(MediaType.APPLICATION_JSON).content(malo))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.run").exists())
                .andExpect(jsonPath("$.errores.correo").exists())
                .andExpect(jsonPath("$.errores.clave").exists());
    }

    @Test
    void registroConCorreoRepetidoDa409() throws Exception {
        when(authService.registrar(any())).thenThrow(new ConflictoException("Ya existe un usuario con ese correo"));
        mvc.perform(post("/api/v1/auth/registro").contentType(MediaType.APPLICATION_JSON).content(REGISTRO_OK))
                .andExpect(status().isConflict());
    }

    @Test
    void loginIncorrectoDa401() throws Exception {
        when(authService.login(any())).thenThrow(new NoAutorizadoException("Correo o clave incorrectos"));
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\":\"ana@correo.cl\",\"clave\":\"mala\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshConTokenInvalidoDa401() throws Exception {
        when(authService.refrescar(any())).thenThrow(new TokenInvalidoException("Token inválido o vencido"));
        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"xxx\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void jsonRotoDa400() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("{no es json"))
                .andExpect(status().isBadRequest());
    }
}
