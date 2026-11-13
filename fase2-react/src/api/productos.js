import clienteApi from "./client.js";

export async function listarProductos() {
    const { data } = await clienteApi.get("/api/v1/productos");
    return data;
}

export async function crearProducto(datos) {
    const { data } = await clienteApi.post("/api/v1/productos", datos);
    return data;
}

export async function actualizarProducto(id, datos) {
    const { data } = await clienteApi.put(`/api/v1/productos/${id}`, datos);
    return data;
}

export async function eliminarProducto(id) {
    await clienteApi.delete(`/api/v1/productos/${id}`);
}