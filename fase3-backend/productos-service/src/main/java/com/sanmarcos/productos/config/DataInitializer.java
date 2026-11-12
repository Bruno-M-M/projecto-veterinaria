package com.sanmarcos.productos.config;

import com.sanmarcos.productos.model.Categoria;
import com.sanmarcos.productos.model.Producto;
import com.sanmarcos.productos.repository.CategoriaRepository;
import com.sanmarcos.productos.repository.ProductoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Component
public class DataInitializer implements CommandLineRunner {

    private final CategoriaRepository categorias;
    private final ProductoRepository productos;

    public DataInitializer(CategoriaRepository categorias, ProductoRepository productos) {
        this.categorias = categorias;
        this.productos = productos;
    }

    @Override
    public void run(String... args) throws IOException {
        if (productos.count() > 0) {
            return;
        }

        Map<String, Categoria> porNombre = new HashMap<>();
        categorias.findAll().forEach(c -> porNombre.put(c.getNombre(), c));

        try (BufferedReader lector = new BufferedReader(new InputStreamReader(
                new ClassPathResource("seed/productos.csv").getInputStream(), StandardCharsets.UTF_8))) {

            lector.readLine();

            String linea;
            while ((linea = lector.readLine()) != null) {
                String[] c = linea.split("\\|", -1);

                Categoria categoria = porNombre.get(c[1]);
                if (categoria == null) {
                    categoria = new Categoria();
                    categoria.setNombre(c[1]);
                    categoria = categorias.save(categoria);
                    porNombre.put(c[1], categoria);
                }

                Producto p = new Producto();
                p.setCodigo(c[0]);
                p.setCategoria(categoria);
                p.setNombre(c[2]);
                p.setDescripcion(c[3]);
                p.setPrecio(Integer.valueOf(c[4]));
                p.setStock(Integer.valueOf(c[5]));
                p.setStockCritico(Integer.valueOf(c[6]));
                p.setActivo(true);
                productos.save(p);
            }
        }
    }
}
