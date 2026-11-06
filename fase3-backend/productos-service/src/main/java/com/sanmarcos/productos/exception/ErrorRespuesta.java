package com.sanmarcos.productos.exception;

import java.time.Instant;
import java.util.Map;

public record ErrorRespuesta(Instant fecha, int estado,
                             String error, String mensaje,
                             String ruta, Map<String, String> errores) {
}
