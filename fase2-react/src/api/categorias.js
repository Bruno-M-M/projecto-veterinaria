import clienteApi from "./client.js";

export async function listarCategorias() {
    const { data } = await clienteApi.get("/api/v1/categorias");
    return data;
}