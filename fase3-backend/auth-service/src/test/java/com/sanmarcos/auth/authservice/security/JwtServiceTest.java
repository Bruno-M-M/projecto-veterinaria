package com.sanmarcos.auth.authservice.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

class JwtServiceTest {

    private static final String SECRETO = "clave-de-prueba-con-mas-de-32-caracteres-123";
    private final JwtService jwt = new JwtService(SECRETO, 30, 7);

    @Test
    void secretoCortoNoArranca() {
        assertThatThrownBy(() -> new JwtService("corta", 30, 7))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void tokenDeAccesoLlevaIdRolYTipo() {
        Jwt t = jwt.validar(jwt.generarAcceso(5L, "TRABAJADOR"), JwtService.TIPO_ACCESO);
        assertThat(t.getSubject()).isEqualTo("5");
        assertThat(t.getClaimAsString("rol")).isEqualTo("TRABAJADOR");
        assertThat(t.getClaimAsString("tipo")).isEqualTo("access");
    }

    @Test
    void tokenVencidoSeRechaza() {
        String vencido = TokenDePrueba.vencido(SECRETO, 1L, "ADMINISTRADOR", JwtService.TIPO_ACCESO);
        assertThatThrownBy(() -> jwt.validar(vencido, JwtService.TIPO_ACCESO))
                .isInstanceOf(TokenInvalidoException.class);
    }

    @Test
    void tokenDeRefrescoNoSirveComoAcceso() {
        String refresco = jwt.generarRefresco(1L, "CLIENTE");
        assertThatThrownBy(() -> jwt.validar(refresco, JwtService.TIPO_ACCESO))
                .isInstanceOf(TokenInvalidoException.class);
    }

    @Test
    void tokenDeAccesoNoSirveParaRenovar() {
        String acceso = jwt.generarAcceso(1L, "CLIENTE");
        assertThatThrownBy(() -> jwt.validar(acceso, JwtService.TIPO_REFRESCO))
                .isInstanceOf(TokenInvalidoException.class);
    }

    @Test
    void tokenFirmadoConOtraClaveSeRechaza() {
        String ajeno = new JwtService("otra-clave-distinta-de-mas-de-32-caracteres-9", 30, 7)
                .generarAcceso(1L, "ADMINISTRADOR");
        assertThatThrownBy(() -> jwt.validar(ajeno, JwtService.TIPO_ACCESO))
                .isInstanceOf(TokenInvalidoException.class);
    }

    @Test
    void tokenBasuraSeRechaza() {
        assertThatThrownBy(() -> jwt.validar("esto.no.es.jwt", JwtService.TIPO_ACCESO))
                .isInstanceOf(TokenInvalidoException.class);
    }
}
