package com.sanmarcos.productos.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

/**
 * Valida los tokens que emite auth-service. Usa la misma clave JWT_SECRET;
 * este servicio nunca emite tokens, solo los verifica.
 */
@Service
public class JwtService {

    public static final String TIPO_ACCESO = "access";

    private final JwtDecoder decoder;

    public JwtService(@Value("${jwt.secret}") String secreto) {
        byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET debe tener al menos 32 caracteres");
        }
        SecretKey clave = new SecretKeySpec(bytes, "HmacSHA256");

        NimbusJwtDecoder decodificador = NimbusJwtDecoder.withSecretKey(clave)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        decodificador.setJwtValidator(new JwtTimestampValidator(Duration.ZERO));
        this.decoder = decodificador;
    }

    public Jwt validar(String token, String tipoEsperado) {
        Jwt jwt;
        try {
            jwt = decoder.decode(token);
        } catch (JwtException e) {
            throw new TokenInvalidoException("Token inválido o vencido");
        }
        if (!tipoEsperado.equals(jwt.getClaimAsString("tipo"))) {
            throw new TokenInvalidoException("El token no es del tipo esperado");
        }
        return jwt;
    }
}
