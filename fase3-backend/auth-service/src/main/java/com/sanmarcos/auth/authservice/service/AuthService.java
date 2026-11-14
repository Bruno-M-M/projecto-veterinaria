package com.sanmarcos.auth.authservice.service;

import com.sanmarcos.auth.authservice.dto.LoginRequest;
import com.sanmarcos.auth.authservice.dto.RegistroRequest;
import com.sanmarcos.auth.authservice.dto.TokenRespuesta;
import com.sanmarcos.auth.authservice.dto.UsuarioResponse;
import com.sanmarcos.auth.authservice.exception.ConflictoException;
import com.sanmarcos.auth.authservice.exception.NoAutorizadoException;
import com.sanmarcos.auth.authservice.model.Usuario;
import com.sanmarcos.auth.authservice.repository.RolRepository;
import com.sanmarcos.auth.authservice.repository.UsuarioRepository;
import com.sanmarcos.auth.authservice.security.JwtService;
import com.sanmarcos.auth.authservice.validation.RunUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarios;
    private final RolRepository roles;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarios, RolRepository roles,
                       PasswordEncoder encoder, JwtService jwtService) {
        this.usuarios = usuarios;
        this.roles = roles;
        this.encoder = encoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public UsuarioResponse registrar(RegistroRequest req) {
        String run = RunUtil.normalizar(req.run());
        String correo = req.correo().trim().toLowerCase();
        if (usuarios.existsByCorreo(correo)) throw new ConflictoException("Ya existe un usuario con ese correo");
        if (usuarios.existsByRun(run))       throw new ConflictoException("Ya existe un usuario con ese RUN");

        Usuario u = new Usuario();
        u.setRol(roles.findByNombre("CLIENTE").orElseThrow(
                () -> new IllegalStateException("Falta el rol CLIENTE en la base")));
        u.setRun(run);
        u.setNombres(req.nombres().trim());
        u.setApellidos(req.apellidos().trim());
        u.setCorreo(correo);
        u.setClave(encoder.encode(req.clave()));      // BCrypt
        u.setTelefono(req.telefono());
        u.setRegion(req.region());
        u.setComuna(req.comuna());
        u.setActivo(true);
        return UsuarioResponse.de(usuarios.save(u));
    }

    @Transactional(readOnly = true)
    public TokenRespuesta login(LoginRequest req) {
        Usuario u = usuarios.findByCorreo(req.correo().trim().toLowerCase())
                .orElseThrow(() -> new NoAutorizadoException("Correo o clave incorrectos"));
        if (!encoder.matches(req.clave(), u.getClave()))
            throw new NoAutorizadoException("Correo o clave incorrectos");
        if (!u.isActivo())
            throw new NoAutorizadoException("El usuario está desactivado");
        return emitirTokens(u);
    }

    @Transactional(readOnly = true)
    public TokenRespuesta refrescar(String refreshToken) {
        // Lanza TokenInvalidoException (401) si está vencido, mal firmado o no es de refresco.
        Jwt jwt = jwtService.validar(refreshToken, JwtService.TIPO_REFRESCO);
        Usuario u = usuarios.findById(Long.valueOf(jwt.getSubject()))
                .orElseThrow(() -> new NoAutorizadoException("El usuario ya no existe"));
        if (!u.isActivo()) throw new NoAutorizadoException("El usuario está desactivado");
        return emitirTokens(u);
    }

    private TokenRespuesta emitirTokens(Usuario u) {
        String rol = u.getRol().getNombre();
        return new TokenRespuesta(
                jwtService.generarAcceso(u.getId(), rol),
                jwtService.generarRefresco(u.getId(), rol),
                "Bearer", jwtService.segundosAcceso(), UsuarioResponse.de(u));
    }
}