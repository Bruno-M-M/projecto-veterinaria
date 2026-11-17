import clienteApi from "./client.js";

export async function listarUsuarios() {
    const { data } = await clienteApi.get("/api/v1/usuarios");
    return data;
}

export async function crearUsuario(datos) {
    const { data } = await clienteApi.post("/api/v1/usuarios", datos);
    return data;
}

export async function editarUsuario(id, datos) {
    const { data } = await clienteApi.put(`/api/v1/usuarios/${id}`, datos);
    return data;
}

export async function cambiarEstadoUsuario(id, activo) {
    const accion = activo ? "activar" : "desactivar";
    const { data } = await clienteApi.patch(`/api/v1/usuarios/${id}/${accion}`);
    return data;
}