package com.sanmarcos.productos.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    private final JwtService jwt = new JwtService(TokenDePrueba.SECRETO);

    @Test
    void validar_conTokenDeAcceso_devuelveRolEId() {
        Jwt resultado = jwt.validar(TokenDePrueba.acceso("VENDEDOR"), JwtService.TIPO_ACCESO);

        assertEquals("VENDEDOR", resultado.getClaimAsString("rol"));
        assertEquals("1", resultado.getSubject());
    }

    @Test
    void validar_conTokenVencido_lanzaExcepcion() {
        TokenInvalidoException ex = assertThrows(TokenInvalidoException.class,
                () -> jwt.validar(TokenDePrueba.vencido("ADMINISTRADOR"), JwtService.TIPO_ACCESO));

        assertEquals("Token inválido o vencido", ex.getMessage());
    }

    @Test
    void validar_conTokenDeRefresco_lanzaExcepcion() {
        TokenInvalidoException ex = assertThrows(TokenInvalidoException.class,
                () -> jwt.validar(TokenDePrueba.refresco("ADMINISTRADOR"), JwtService.TIPO_ACCESO));

        assertEquals("El token no es del tipo esperado", ex.getMessage());
    }

    @Test
    void validar_conOtraClave_lanzaExcepcion() {
        JwtService otroServicio = new JwtService("otra-clave-distinta-con-mas-de-32-caracteres");

        assertThrows(TokenInvalidoException.class,
                () -> otroServicio.validar(TokenDePrueba.acceso("ADMINISTRADOR"), JwtService.TIPO_ACCESO));
    }

    @Test
    void validar_conTextoQueNoEsJwt_lanzaExcepcion() {
        assertThrows(TokenInvalidoException.class,
                () -> jwt.validar("esto-no-es-un-jwt", JwtService.TIPO_ACCESO));
    }

    @Test
    void constructor_conClaveCorta_lanzaExcepcion() {
        assertThrows(IllegalStateException.class, () -> new JwtService("corta"));
    }
}