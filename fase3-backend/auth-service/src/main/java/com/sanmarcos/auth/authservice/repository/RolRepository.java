package com.sanmarcos.auth.authservice.repository;

import java.util.Optional;

import com.sanmarcos.auth.authservice.model.Rol;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolRepository extends JpaRepository<Rol, Long> {

    Optional<Rol> findByNombre(String nombre);
}
