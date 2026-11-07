import clienteApi from "./client.js";

export async function listarProductos() {
    const { data } = await clienteApi.get("/api/v1/productos");
    return data;
}