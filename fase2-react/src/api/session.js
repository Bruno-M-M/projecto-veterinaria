export const CLAVE_TOKEN = "token";
const CLAVE_REFRESH = "refreshToken";
const CLAVE_USUARIO = "usuario";

export function guardarSesion({ accessToken, refreshToken, usuario }) {
    localStorage.setItem(CLAVE_TOKEN, accessToken);
    localStorage.setItem(CLAVE_REFRESH, refreshToken);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function leerUsuario() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_USUARIO));
    } catch {
        return null;
    }
}

export const leerRefresh = () => localStorage.getItem(CLAVE_REFRESH);
export const hayToken = () => !!localStorage.getItem(CLAVE_TOKEN);

export function limpiarSesion() {
    [CLAVE_TOKEN, CLAVE_REFRESH, CLAVE_USUARIO].forEach((k) => localStorage.removeItem(k));
}