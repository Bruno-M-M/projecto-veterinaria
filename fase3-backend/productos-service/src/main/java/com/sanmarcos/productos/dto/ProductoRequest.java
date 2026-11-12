package com.sanmarcos.productos.dto;

import jakarta.validation.constraints.*;

public class ProductoRequest {

    @NotBlank(message = "El codigo es obligatorio.")
    @Size(max = 5, message = "El codigo no puede superar los 5 caracteres.")
    private String codigo;

    @NotBlank(message = "El nombre es obligatorio.")
    @Size(max = 60, message = "El nombre no puede pasar los 60 caracteres.")
    private String nombre;

    @NotBlank(message = "La descripcion es obligatoria.")
    @Size(max = 300, message = "La descripcion no puede superar los 300 caracteres.")
    private String descripcion;

    @NotNull(message = "El producto debe tener precio.")
    @Max(value = 99999999)
    @PositiveOrZero
    private Integer precio;

    @NotNull(message = "El producto debe tener existencias para ser vendido.")
    @PositiveOrZero
    private Integer stock;

    @NotNull(message = "El producto debe tener un limite minimo de existencias.")
    @PositiveOrZero
    private Integer stockCritico;

    @NotNull(message = "El producto debe tener un estado.")
    private Boolean activo;

    @NotNull(message = "El producto debe pertenecer a una categoria.")
    private Long categoriaId;

    public ProductoRequest(){}

    public ProductoRequest(String codigo, String nombre, String descripcion, Integer precio, Integer stock, Integer stockCritico, Boolean activo, Long categoriaId) {
        this.codigo = codigo;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.stock = stock;
        this.stockCritico = stockCritico;
        this.activo = activo;
        this.categoriaId = categoriaId;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Integer getPrecio() {
        return precio;
    }

    public void setPrecio(Integer precio) {
        this.precio = precio;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Integer getStockCritico() {
        return stockCritico;
    }

    public void setStockCritico(Integer stockCritico) {
        this.stockCritico = stockCritico;
    }

    public Long getCategoriaId() {
        return categoriaId;
    }

    public void setCategoriaId(Long categoriaId) {
        this.categoriaId = categoriaId;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
