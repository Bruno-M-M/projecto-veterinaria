export function formatoPrecio(valor) {
    return `$${Number(valor).toLocaleString("es-CL")}`;
}

export function aProductoFrontend(r) {
    return {
        id: r.id,
        codigo: r.codigo,
        nombre: r.nombre,
        descripcion: r.descripcion,
        precio: r.precio,
        stock: r.stock,
        stockCritico: r.stockCritico,
        activo: r.activo,
        categoria: normalizarTexto(r.categoria),
    };
}

export function esStockCritico(producto) {
    const stock = Number(producto.stock);
    const critico = Number(producto.stockCritico);
    if (Number.isNaN(stock)) return false;
    if (!Number.isNaN(critico) && critico > 0) return stock <= critico;
    return stock <= 5;
}

export function normalizarTexto(texto) {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

export function aSolicitudProducto(datos, categoriaId) {
    return {
        codigo: datos.codigo.trim(),
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion.trim(),
        precio: Number(datos.precio),
        stock: Number(datos.stock),
        stockCritico: Number(datos.stockCritico),
        activo: datos.activo ?? true,
        categoriaId,
    };
}

export function idDeCategoria(categorias, identificador) {
    return categorias.find((c) => normalizarTexto(c.nombre) === identificador)?.id;
}

export function mensajeDeError(error) {
    return error.response?.data?.mensaje ?? "No se pudo conectar con el servidor.";
}