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