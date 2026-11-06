package com.sanmarcos.productos.repository;

import com.sanmarcos.productos.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    Optional<Producto> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    List<Producto> findByCategoriaId(Long categoriaId);

    boolean existsByCategoriaId(Long id);

    @Query("select p from Producto p where p.stock <= p.stockCritico")
    List<Producto> findStockCritico();
}
