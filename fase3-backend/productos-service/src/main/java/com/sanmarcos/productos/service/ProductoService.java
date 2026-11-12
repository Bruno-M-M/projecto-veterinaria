package com.sanmarcos.productos.service;

import com.sanmarcos.productos.dto.ProductoRequest;
import com.sanmarcos.productos.dto.ProductoResponse;
import com.sanmarcos.productos.exception.ConflictoException;
import com.sanmarcos.productos.exception.RecursoNoEncontradoException;
import com.sanmarcos.productos.model.Categoria;
import com.sanmarcos.productos.model.Producto;
import com.sanmarcos.productos.repository.CategoriaRepository;
import com.sanmarcos.productos.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductoService {

    private final ProductoRepository productos;
    private final CategoriaRepository categorias;

    private ProductoResponse productoResponse(Producto producto) {
        Categoria categoria = producto.getCategoria();
        return new ProductoResponse(
                producto.getId(),
                producto.getCodigo(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getPrecio(),
                producto.getStock(),
                producto.getStockCritico(),
                producto.getActivo(),
                categoria.getId(),
                categoria.getNombre());
    }

    public ProductoService(ProductoRepository productos, CategoriaRepository categorias) {
        this.productos = productos;
        this.categorias = categorias;
    }

    private Producto getProductoById(Long id) {
        return productos.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe el producto con id " + id + "."
                ));
    }

    private Categoria getCategoriaById(Long id) {
        return categorias.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe la categoria con id " + id + "."));
    }

    @Transactional(readOnly = true)
    public ProductoResponse getProductoId(Long id) {
        return productoResponse(getProductoById(id));
    }

    @Transactional
    public ProductoResponse createProducto(ProductoRequest nuevo) {
        String codigo = nuevo.getCodigo().trim();
        Long categoriaId = nuevo.getCategoriaId();

        if (productos.existsByCodigo(codigo)) {
            throw new ConflictoException("Ya existe un producto con el codigo " + codigo + ".");
        }

        Categoria categoria = getCategoriaById(categoriaId);

        Producto producto = new Producto();
        producto.setCodigo(codigo);
        producto.setNombre(nuevo.getNombre().trim());
        producto.setDescripcion(nuevo.getDescripcion().trim());
        producto.setPrecio(nuevo.getPrecio());
        producto.setStock(nuevo.getStock());
        producto.setStockCritico(nuevo.getStockCritico());
        producto.setActivo(nuevo.getActivo());
        producto.setCategoria(categoria);

        return productoResponse(productos.save(producto));
    }

    @Transactional
    public ProductoResponse updateProducto(Long id, ProductoRequest update) {

        Producto antiguo = getProductoById(id);
        String codigo = update.getCodigo().trim();
        String nombre = update.getNombre().trim();
        String descripcion = update.getDescripcion().trim();
        Integer precio = update.getPrecio();
        Integer stock = update.getStock();
        Integer stockCritico = update.getStockCritico();
        Boolean activo = update.getActivo();
        Long categoriaId = update.getCategoriaId();

        if (!antiguo.getCodigo().equals(codigo) && productos.existsByCodigo(codigo)) {
            throw new ConflictoException("Ya existe un producto con el codigo " + codigo + ".");
        }

        Categoria categoria = getCategoriaById(categoriaId);

        antiguo.setCodigo(codigo);
        antiguo.setNombre(nombre);
        antiguo.setDescripcion(descripcion);
        antiguo.setPrecio(precio);
        antiguo.setStock(stock);
        antiguo.setStockCritico(stockCritico);
        antiguo.setActivo(activo);
        antiguo.setCategoria(categoria);

        return productoResponse(productos.save(antiguo));
    }

    @Transactional
    public void deleteProducto(Long id) {
        productos.delete(getProductoById(id));
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> getProductos(Long categoriaId) {
        List<Producto> lista;
        if (categoriaId == null) {
            lista = productos.findAll();
        } else {
            getCategoriaById(categoriaId);   // 404 si la categoría no existe
            lista = productos.findByCategoriaId(categoriaId);
        }
        return lista.stream().map(this::productoResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductoResponse getProductoCodigo(String codigo) {
        return productoResponse(productos.findByCodigo(codigo.trim())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe el producto con codigo " + codigo + ".")));
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> getStockCritico() {
        return productos.findStockCritico().stream().map(this::productoResponse).toList();
    }

    private Producto getProductoParaActualizar(Long id) {
        return productos.buscarParaActualizar(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe el producto con id " + id + "."));
    }

    @Transactional
    public ProductoResponse descontarStock(Long id, Integer cantidad) {
        Producto producto = getProductoParaActualizar(id);

        if (!producto.getActivo()) {
            throw new ConflictoException("El producto " + producto.getNombre()
                    + " esta desactivado y no se puede vender.");
        }

        if (producto.getStock() < cantidad) {
            throw new ConflictoException("Stock insuficiente de " + producto.getNombre()
                    + ": quedan " + producto.getStock() + " unidades.");
        }

        producto.setStock(producto.getStock() - cantidad);
        return productoResponse(productos.save(producto));
    }

    @Transactional
    public ProductoResponse reponerStock(Long id, Integer cantidad) {
        Producto producto = getProductoParaActualizar(id);

        producto.setStock(producto.getStock() + cantidad);
        return productoResponse(productos.save(producto));
    }
}


