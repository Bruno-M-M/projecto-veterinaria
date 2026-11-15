package com.sanmarcos.auth.authservice.security;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.springframework.http.HttpStatus;

final class RespuestaJson {

    private RespuestaJson() {}

    static void escribir(HttpServletResponse respuesta, HttpStatus estado,
                         String mensaje, String ruta) throws IOException {
        respuesta.setStatus(estado.value());
        respuesta.setContentType("application/json");
        respuesta.setCharacterEncoding(StandardCharsets.UTF_8.name());
        String cuerpo = "{\"fecha\":\"" + Instant.now() + "\","
                + "\"estado\":" + estado.value() + ","
                + "\"error\":\"" + estado.getReasonPhrase() + "\","
                + "\"mensaje\":\"" + escapar(mensaje) + "\","
                + "\"ruta\":\"" + escapar(ruta) + "\","
                + "\"errores\":null}";
        respuesta.getWriter().write(cuerpo);
    }

    private static String escapar(String texto) {
        return texto == null ? "" : texto.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
