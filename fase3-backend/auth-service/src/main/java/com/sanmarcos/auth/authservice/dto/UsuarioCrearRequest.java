package com.sanmarcos.auth.authservice.dto;

import com.sanmarcos.auth.authservice.validation.RunValido;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UsuarioCrearRequest(
        @NotBlank(message = "El RUN es obligatorio") @RunValido String run,
        @NotBlank(message = "Los nombres son obligatorios") @Size(max = 80) String nombres,
        @NotBlank(message = "Los apellidos son obligatorios") @Size(max = 80) String apellidos,
        @NotBlank(message = "El correo es obligatorio") @Email(message = "El correo no es válido")
        @Size(max = 120) String correo,
        @NotBlank(message = "La clave es obligatoria")
        @Size(min = 8, max = 72, message = "La clave debe tener entre 8 y 72 caracteres") String clave,
        @Size(max = 20) String telefono,
        @Size(max = 60) String region,
        @Size(max = 60) String comuna,
        @NotBlank(message = "El rol es obligatorio")
        @Pattern(regexp = "ADMINISTRADOR|VENDEDOR|CLIENTE",
                message = "El rol debe ser ADMINISTRADOR, VENDEDOR o CLIENTE") String rol) {
}
