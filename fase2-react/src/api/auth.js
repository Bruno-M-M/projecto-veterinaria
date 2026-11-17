import clienteApi from "./client.js";
import { guardarSesion, limpiarSesion } from "./session.js";

export async function iniciarSesion(correo, clave) {
    const { data } = await clienteApi.post("/api/v1/auth/login", { correo, clave });
    guardarSesion(data);
    return data.usuario;
}

export async function registrarUsuario(datos) {
    const { data } = await clienteApi.post("/api/v1/auth/registro", datos);
    return data;
}

export function cerrarSesion() {
    limpiarSesion();
}