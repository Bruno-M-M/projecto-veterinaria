package com.sanmarcos.ventas.client;

import com.sanmarcos.ventas.exception.ResourceNotFoundException;
import com.sanmarcos.ventas.exception.ServicioExternoException;
import com.sanmarcos.ventas.exception.StockInsuficienteException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

@Component
public class ProductoClientHttp implements ProductoClient {

    private final RestClient restClient;

    public ProductoClientHttp(@Value("${productos.url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    // Solo los campos que ventas necesita del ProductoResponse de Bruno
    private record ProductoRemoto(Long id, String nombre, Integer precio,
                                  Integer stock, Boolean activo) {
    }

    @Override
    public ProductoInfo obtener(Integer productoId) {
        try {
            ProductoRemoto p = restClient.get()
                    .uri("/api/v1/productos/{id}", productoId)
                    .retrieve()
                    .onStatus(s -> s.value() == 404, (req, res) -> {
                        throw new ResourceNotFoundException(
                                "Producto no encontrado con ID: " + productoId);
                    })
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new ServicioExternoException(
                                "productos-service respondió " + res.getStatusCode().value());
                    })
                    .body(ProductoRemoto.class);

            if (p == null) {
                throw new ServicioExternoException("productos-service no devolvió datos");
            }
            if (Boolean.FALSE.equals(p.activo())) {
                throw new StockInsuficienteException(
                        "El producto " + p.nombre() + " no está disponible");
            }
            return new ProductoInfo(p.id().intValue(), p.nombre(),
                    p.precio().doubleValue(), p.stock());

        } catch (RestClientException e) {
            throw new ServicioExternoException("No se pudo conectar con productos-service");
        }
    }

    @Override
    public void descontarStock(Integer productoId, int cantidad) {
        try {
            restClient.post()
                    .uri("/api/v1/productos/{id}/descontar", productoId)
                    .body(Map.of("cantidad", cantidad))
                    .retrieve()
                    .onStatus(s -> s.value() == 404, (req, res) -> {
                        throw new ResourceNotFoundException(
                                "Producto no encontrado con ID: " + productoId);
                    })
                    .onStatus(s -> s.value() == 409, (req, res) -> {
                        throw new StockInsuficienteException(
                                "No se pudo descontar el producto " + productoId
                                        + " (sin stock suficiente o desactivado)");
                    })
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new ServicioExternoException(
                                "productos-service respondió " + res.getStatusCode().value());
                    })
                    .toBodilessEntity();

        } catch (RestClientException e) {
            throw new ServicioExternoException("No se pudo conectar con productos-service");
        }
    }

    @Override
    public void reponerStock(Integer productoId, int cantidad) {
        try {
            restClient.post()
                    .uri("/api/v1/productos/{id}/reponer", productoId)
                    .body(Map.of("cantidad", cantidad))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new ServicioExternoException(
                                "productos-service respondió " + res.getStatusCode().value());
                    })
                    .toBodilessEntity();

        } catch (RestClientException e) {
            throw new ServicioExternoException("No se pudo conectar con productos-service");
        }
    }
}