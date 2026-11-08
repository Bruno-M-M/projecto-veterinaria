package com.sanmarcos.ventas.client;

import com.sanmarcos.ventas.exception.ResourceNotFoundException;
import com.sanmarcos.ventas.exception.StockInsuficienteException;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

// TEMPORAL: se reemplaza por la llamada real a productos-service.
@Component
public class ProductoClientSimulado implements ProductoClient {

    private final Map<Integer, ProductoInfo> productos = new HashMap<>();

    public ProductoClientSimulado() {
        productos.put(1, new ProductoInfo(1, "Amoxibay 250mg", 4200.0, 45));
        productos.put(2, new ProductoInfo(2, "Enrox 50mg", 6800.0, 30));
        productos.put(3, new ProductoInfo(3, "Metrobay 250mg", 3900.0, 28));
        productos.put(4, new ProductoInfo(4, "Nexgard", 9500.0, 60));
        productos.put(5, new ProductoInfo(5, "Bravecto", 18900.0, 4));
    }

    @Override
    public ProductoInfo obtener(Integer productoId) {
        ProductoInfo p = productos.get(productoId);
        if (p == null) {
            throw new ResourceNotFoundException("Producto no encontrado con ID: " + productoId);
        }
        return p;
    }

    @Override
    public void descontarStock(Integer productoId, int cantidad) {
        ProductoInfo p = obtener(productoId);
        if (p.stock() < cantidad) {
            throw new StockInsuficienteException("Stock insuficiente para " + p.nombre());
        }
        productos.put(productoId,
                new ProductoInfo(p.id(), p.nombre(), p.precio(), p.stock() - cantidad));
    }
}