package com.sanmarcos.ventas.repository;

import com.sanmarcos.ventas.model.DetalleBoleta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleBoletaRepository extends JpaRepository<DetalleBoleta, Integer> {
    List<DetalleBoleta> findByBoletaId(Integer boletaId);
}