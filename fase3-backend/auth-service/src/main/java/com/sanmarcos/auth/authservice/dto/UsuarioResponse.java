package com.sanmarcos.auth.authservice.dto;

import com.sanmarcos.auth.authservice.model.Usuario;

public record UsuarioResponse(Long id, String run, String nombres, String apellidos,
                              String correo, String telefono, String region, String comuna,
                              String rol, boolean activo) {

    public static UsuarioResponse de(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getRun(), u.getNombres(), u.getApellidos(),
                u.getCorreo(), u.getTelefono(), u.getRegion(), u.getComuna(),
                u.getRol().getNombre(), u.isActivo());
    }
}
