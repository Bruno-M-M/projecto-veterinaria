package com.sanmarcos.auth.authservice.service;

import com.sanmarcos.auth.authservice.dto.UsuarioCrearRequest;
import com.sanmarcos.auth.authservice.dto.UsuarioEditarRequest;
import com.sanmarcos.auth.authservice.dto.UsuarioResponse;
import com.sanmarcos.auth.authservice.exception.ConflictoException;
import com.sanmarcos.auth.authservice.exception.ProhibidoException;
import com.sanmarcos.auth.authservice.exception.RecursoNoEncontradoException;
import com.sanmarcos.auth.authservice.model.Rol;
import com.sanmarcos.auth.authservice.model.Usuario;
import com.sanmarcos.auth.authservice.repository.RolRepository;
import com.sanmarcos.auth.authservice.repository.UsuarioRepository;
import com.sanmarcos.auth.authservice.validation.RunUtil;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarios;
    private final RolRepository roles;
    private final PasswordEncoder encoder;

    public UsuarioService(UsuarioRepository usuarios, RolRepository roles, PasswordEncoder encoder) {
        this.usuarios = usuarios;
        this.roles = roles;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarios.findAll().stream().map(UsuarioResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id) {
        return UsuarioResponse.de(buscar(id));
    }

    @Transactional
    public UsuarioResponse crear(UsuarioCrearRequest req) {
        String run = RunUtil.normalizar(req.run());
        String correo = req.correo().trim().toLowerCase();
        if (usuarios.existsByCorreo(correo)) {
            throw new ConflictoException("Ya existe un usuario con ese correo");
        }
        if (usuarios.existsByRun(run)) {
            throw new ConflictoException("Ya existe un usuario con ese RUN");
        }
        Usuario u = new Usuario();
        u.setRol(rol(req.rol()));
        u.setRun(run);
        u.setNombres(req.nombres().trim());
        u.setApellidos(req.apellidos().trim());
        u.setCorreo(correo);
        u.setClave(encoder.encode(req.clave()));
        u.setTelefono(req.telefono());
        u.setRegion(req.region());
        u.setComuna(req.comuna());
        u.setActivo(true);
        return UsuarioResponse.de(usuarios.save(u));
    }

    @Transactional
    public UsuarioResponse editar(Long id, UsuarioEditarRequest req, String idSolicitante) {
        Usuario u = buscar(id);
        String run = RunUtil.normalizar(req.run());
        String correo = req.correo().trim().toLowerCase();

        usuarios.findByCorreo(correo).filter(o -> !o.getId().equals(id)).ifPresent(o -> {
            throw new ConflictoException("Ya existe un usuario con ese correo");
        });
        usuarios.findByRun(run).filter(o -> !o.getId().equals(id)).ifPresent(o -> {
            throw new ConflictoException("Ya existe un usuario con ese RUN");
        });
        // Un administrador no puede quitarse a sí mismo el rol: se podría quedar sin acceso.
        if (String.valueOf(id).equals(idSolicitante) && !"ADMINISTRADOR".equals(req.rol())) {
            throw new ProhibidoException("No puedes cambiar tu propio rol de administrador");
        }

        u.setRol(rol(req.rol()));
        u.setRun(run);
        u.setNombres(req.nombres().trim());
        u.setApellidos(req.apellidos().trim());
        u.setCorreo(correo);
        u.setTelefono(req.telefono());
        u.setRegion(req.region());
        u.setComuna(req.comuna());
        // La clave es opcional al editar: solo se cambia si viene.
        if (req.clave() != null && !req.clave().isBlank()) {
            u.setClave(encoder.encode(req.clave()));
        }
        return UsuarioResponse.de(usuarios.save(u));
    }

    @Transactional
    public UsuarioResponse cambiarActivo(Long id, boolean activo, String idSolicitante) {
        Usuario u = buscar(id);
        if (!activo && String.valueOf(id).equals(idSolicitante)) {
            throw new ProhibidoException("No puedes desactivar tu propio usuario");
        }
        u.setActivo(activo);
        return UsuarioResponse.de(usuarios.save(u));
    }

    private Usuario buscar(Long id) {
        return usuarios.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario con id " + id));
    }

    private Rol rol(String nombre) {
        return roles.findByNombre(nombre)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el rol " + nombre));
    }
}
