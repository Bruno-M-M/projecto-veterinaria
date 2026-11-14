package com.sanmarcos.auth.authservice.config;

import com.sanmarcos.auth.authservice.model.Rol;
import com.sanmarcos.auth.authservice.model.Usuario;
import com.sanmarcos.auth.authservice.repository.RolRepository;
import com.sanmarcos.auth.authservice.repository.UsuarioRepository;
import com.sanmarcos.auth.authservice.validation.RunUtil;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

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

    @Bean
    CommandLineRunner cargarAdministrador(RolRepository roles,
                                          UsuarioRepository usuarios,
                                          PasswordEncoder encoder,
                                          @Value("${admin.run}") String run,
                                          @Value("${admin.correo}") String correo,
                                          @Value("${admin.clave}") String clave) {
        return args -> {
            if (correo.isBlank() || clave.isBlank()) return;
            if (usuarios.existsByRol_Nombre("ADMINISTRADOR")) return;

            Usuario admin = new Usuario();
            admin.setRol(roles.findByNombre("ADMINISTRADOR").orElseThrow());
            admin.setRun(RunUtil.normalizar(run));
            admin.setNombres("Administrador");
            admin.setApellidos("Sistema");
            admin.setCorreo(correo.trim().toLowerCase());
            admin.setClave(encoder.encode(clave));
            admin.setActivo(true);
            usuarios.save(admin);
        };
    }
}
