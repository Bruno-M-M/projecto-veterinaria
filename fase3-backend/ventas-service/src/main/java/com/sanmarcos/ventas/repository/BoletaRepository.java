package com.sanmarcos.ventas.repository;

import com.sanmarcos.ventas.model.Boleta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoletaRepository extends JpaRepository<Boleta, Integer> {
    List<Boleta> findByUsuarioId(Integer usuarioId);
}