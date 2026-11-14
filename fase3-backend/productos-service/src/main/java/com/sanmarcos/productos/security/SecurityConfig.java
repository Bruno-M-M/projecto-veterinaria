package com.sanmarcos.productos.security;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtService jwtService) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> {
                            Object motivo = req.getAttribute(JwtAuthFilter.ATRIBUTO_ERROR);
                            String mensaje = motivo != null
                                    ? motivo.toString()
                                    : "Se requiere un token de acceso";
                            RespuestaJson.escribir(res, HttpStatus.UNAUTHORIZED, mensaje, req.getRequestURI());
                        })
                        .accessDeniedHandler((req, res, ex) ->
                                RespuestaJson.escribir(res, HttpStatus.FORBIDDEN,
                                        "Tu rol no tiene permiso para esta acción", req.getRequestURI())))
                // ---- REGLAS POR RUTA (el orden importa: gana la primera que coincide) ----
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // El stock crítico es información interna de la tienda.
                        .requestMatchers(HttpMethod.GET, "/api/v1/productos/stock-critico")
                                .hasAnyRole("ADMINISTRADOR", "VENDEDOR")
                        // La tienda es pública: cualquiera ve productos y categorías.
                        .requestMatchers(HttpMethod.GET, "/api/v1/productos/**", "/api/v1/categorias/**")
                                .permitAll()
                        // Ventas descuenta el carrito completo con el token de quien compra.
                        .requestMatchers(HttpMethod.POST, "/api/v1/productos/descontar-lote")
                        .hasAnyRole("ADMINISTRADOR", "CLIENTE")
                        // Descuento de un solo producto (mismos roles).
                        .requestMatchers(HttpMethod.POST, "/api/v1/productos/*/descontar")
                        .hasAnyRole("ADMINISTRADOR", "CLIENTE")
                        // Crear, editar, eliminar y reponer: solo el administrador.
                        .requestMatchers("/api/v1/productos/**", "/api/v1/categorias/**")
                                .hasRole("ADMINISTRADOR")
                        .anyRequest().authenticated())
                .addFilterBefore(new JwtAuthFilter(jwtService), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${cors.origins}") String origenes) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(origenes.split(",")).map(String::trim).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource fuente = new UrlBasedCorsConfigurationSource();
        fuente.registerCorsConfiguration("/**", config);
        return fuente;
    }
}
