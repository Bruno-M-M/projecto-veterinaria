package com.sanmarcos.ventas.client;

public interface ProductoClient {

    ProductoInfo obtener(Integer productoId);

    void descontarStock(Integer productoId, int cantidad);

    /** Devuelve stock descontado si la compra falla a medias. */
    void reponerStock(Integer productoId, int cantidad);
}