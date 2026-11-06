package com.sanmarcos.auth.authservice.config;

import com.sanmarcos.auth.authservice.model.Rol;
import com.sanmarcos.auth.authservice.repository.RolRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DatosIniciales {

    @Bean
    CommandLineRunner cargarRoles(RolRepository roles) {
        return args -> {
            for (String nombre : List.of("ADMINISTRADOR", "TRABAJADOR", "CLIENTE")) {
                if (roles.findByNombre(nombre).isEmpty()) {
                    roles.save(new Rol(nombre));
                }
            }
        };
    }
}
