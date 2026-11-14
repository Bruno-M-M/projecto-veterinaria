package com.sanmarcos.auth.authservice.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sanmarcos.auth.authservice.dto.UsuarioCrearRequest;
import com.sanmarcos.auth.authservice.dto.UsuarioEditarRequest;
import com.sanmarcos.auth.authservice.exception.ConflictoException;
import com.sanmarcos.auth.authservice.exception.ProhibidoException;
import com.sanmarcos.auth.authservice.exception.RecursoNoEncontradoException;
import com.sanmarcos.auth.authservice.model.Rol;
import com.sanmarcos.auth.authservice.model.Usuario;
import com.sanmarcos.auth.authservice.repository.RolRepository;
import com.sanmarcos.auth.authservice.repository.UsuarioRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock UsuarioRepository usuarios;
    @Mock RolRepository roles;
    @Mock PasswordEncoder encoder;
    @InjectMocks UsuarioService servicio;

    private UsuarioCrearRequest crearReq() {
        return new UsuarioCrearRequest("12345678-5", "Ana", "Pérez", "ana@correo.cl",
                "clave1234", null, null, null, "CLIENTE");
    }

    @Test
    void crearConCorreoRepetidoDa409() {
        when(usuarios.existsByCorreo("ana@correo.cl")).thenReturn(true);
        assertThatThrownBy(() -> servicio.crear(crearReq())).isInstanceOf(ConflictoException.class);
        verify(usuarios, never()).save(any());
    }

    @Test
    void crearConRunRepetidoDa409() {
        when(usuarios.existsByCorreo("ana@correo.cl")).thenReturn(false);
        when(usuarios.existsByRun("12345678-5")).thenReturn(true);
        assertThatThrownBy(() -> servicio.crear(crearReq())).isInstanceOf(ConflictoException.class);
    }

    @Test
    void obtenerInexistenteDa404() {
        when(usuarios.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> servicio.obtener(99L)).isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void adminNoPuedeDesactivarseASiMismo() {
        Usuario u = new Usuario();
        u.setRol(new Rol("ADMINISTRADOR"));
        when(usuarios.findById(1L)).thenReturn(Optional.of(u));
        assertThatThrownBy(() -> servicio.cambiarActivo(1L, false, "1"))
                .isInstanceOf(ProhibidoException.class);
        verify(usuarios, never()).save(any());
    }

    @Test
    void adminNoPuedeQuitarseSuPropioRol() {
        when(usuarios.findById(1L)).thenReturn(Optional.of(new Usuario()));
        when(usuarios.findByCorreo("a@a.cl")).thenReturn(Optional.empty());
        when(usuarios.findByRun("12345678-5")).thenReturn(Optional.empty());
        var req = new UsuarioEditarRequest("12345678-5", "A", "B", "a@a.cl", null, null, null, null, "CLIENTE");
        assertThatThrownBy(() -> servicio.editar(1L, req, "1")).isInstanceOf(ProhibidoException.class);
    }
}
