package com.sanmarcos.ventas.client;

public interface ProductoClient {

    ProductoInfo obtener(Integer productoId);

    void descontarStock(Integer productoId, int cantidad);
}