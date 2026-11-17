package com.sanmarcos.ventas.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

public final class TokenDePrueba {

    public static final String SECRETO = "clave-de-prueba-con-mas-de-32-caracteres-123";

    private TokenDePrueba() {}

    public static String acceso(String rol) {
        Instant ahora = Instant.now();
        return emitir(rol, "access", ahora, ahora.plus(30, ChronoUnit.MINUTES));
    }

    public static String vencido(String rol) {
        Instant ahora = Instant.now();
        return emitir(rol, "access",
                ahora.minus(2, ChronoUnit.HOURS), ahora.minus(1, ChronoUnit.HOURS));
    }

    private static String emitir(String rol, String tipo, Instant emision, Instant vence) {
        SecretKey clave = new SecretKeySpec(
                SECRETO.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        NimbusJwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(clave));
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject("7")
                .claim("rol", rol)
                .claim("tipo", tipo)
                .issuedAt(emision)
                .expiresAt(vence)
                .build();
        JwsHeader cabecera = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(cabecera, claims)).getTokenValue();
    }
}