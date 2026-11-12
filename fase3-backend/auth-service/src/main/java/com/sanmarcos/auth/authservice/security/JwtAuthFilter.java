package com.sanmarcos.auth.authservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.filter.OncePerRequestFilter;

public class JwtAuthFilter extends OncePerRequestFilter {

    public static final String ATRIBUTO_ERROR = "jwt.error";

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String cabecera = request.getHeader("Authorization");

        if (cabecera != null && cabecera.startsWith("Bearer ")) {
            String token = cabecera.substring(7).trim();
            try {
                Jwt jwt = jwtService.validar(token, JwtService.TIPO_ACCESO);
                String rol = jwt.getClaimAsString("rol");
                var autenticacion = new UsernamePasswordAuthenticationToken(
                        jwt.getSubject(), null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + rol)));
                SecurityContextHolder.getContext().setAuthentication(autenticacion);
            } catch (TokenInvalidoException e) {
                SecurityContextHolder.clearContext();
                request.setAttribute(ATRIBUTO_ERROR, e.getMessage());
            }
        }

        chain.doFilter(request, response);
    }
}
