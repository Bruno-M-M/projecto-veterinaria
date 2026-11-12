package com.sanmarcos.auth.authservice.dto;

public record TokenRespuesta(String accessToken, String refreshToken, String tipo,
                             long expiraEnSegundos, UsuarioResponse usuario) {
}
