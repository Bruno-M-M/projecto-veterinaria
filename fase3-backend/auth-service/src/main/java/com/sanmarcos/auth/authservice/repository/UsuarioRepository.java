package com.sanmarcos.auth.authservice.repository;

import com.sanmarcos.auth.authservice.model.Usuario;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreo(String correo);

    Optional<Usuario> findByRun(String run);

    boolean existsByCorreo(String correo);

    boolean existsByRun(String run);

    boolean existsByRol_Nombre(String nombre);
}
