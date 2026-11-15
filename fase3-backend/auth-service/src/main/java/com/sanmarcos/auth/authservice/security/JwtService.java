package com.sanmarcos.auth.authservice.security;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    public static final String TIPO_ACCESO = "access";
    public static final String TIPO_REFRESCO = "refresh";

    private final JwtEncoder encoder;
    private final JwtDecoder decoder;
    private final Duration vidaAcceso;
    private final Duration vidaRefresco;

    public JwtService(@Value("${jwt.secret}") String secreto,
                      @Value("${jwt.access-minutos:30}") long accesoMinutos,
                      @Value("${jwt.refresh-dias:7}") long refrescoDias) {
        byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET debe tener al menos 32 caracteres");
        }
        SecretKey clave = new SecretKeySpec(bytes, "HmacSHA256");

        this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(clave));

        NimbusJwtDecoder decodificador = NimbusJwtDecoder.withSecretKey(clave)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        decodificador.setJwtValidator(new JwtTimestampValidator(Duration.ZERO));
        this.decoder = decodificador;

        this.vidaAcceso = Duration.ofMinutes(accesoMinutos);
        this.vidaRefresco = Duration.ofDays(refrescoDias);
    }

    public String generarAcceso(Long usuarioId, String rol) {
        return emitir(usuarioId, rol, TIPO_ACCESO, vidaAcceso);
    }

    public String generarRefresco(Long usuarioId, String rol) {
        return emitir(usuarioId, rol, TIPO_REFRESCO, vidaRefresco);
    }

    public long segundosAcceso() {
        return vidaAcceso.toSeconds();
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

    public String emitir(Long usuarioId, String rol, String tipo, Duration vida) {
        Instant ahora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(String.valueOf(usuarioId))
                .claim("rol", rol)
                .claim("tipo", tipo)
                .issuedAt(ahora)
                .expiresAt(ahora.plus(vida))
                .build();
        JwsHeader cabecera = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(cabecera, claims)).getTokenValue();
    }
}
