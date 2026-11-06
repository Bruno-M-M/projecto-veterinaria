package com.sanmarcos.ventas.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "boleta")
public class Boleta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "usuario_id", nullable = false)
    private Integer usuarioId;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    @Column(name = "total", nullable = false)
    private Double total;

    // true = PAGADA, false = ANULADA
    @Column(name = "estado", nullable = false)
    private Boolean estado;
}