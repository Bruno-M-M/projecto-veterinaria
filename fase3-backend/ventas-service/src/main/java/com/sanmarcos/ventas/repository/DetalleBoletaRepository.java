package com.sanmarcos.ventas.repository;

import com.sanmarcos.ventas.model.Detalle_boleta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleBoletaRepository extends JpaRepository<Detalle_boleta, Integer> {
    List<Detalle_boleta> findByBoletaId(Integer boletaId);
}