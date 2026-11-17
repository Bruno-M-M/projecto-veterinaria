export const CLAVE_TOKEN = "token";
const CLAVE_REFRESH = "refreshToken";
const CLAVE_USUARIO = "usuario";

export const ROL_ADMIN = "ADMINISTRADOR";
export const ROL_VENDEDOR = "VENDEDOR";
export const ROL_CLIENTE = "CLIENTE";

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

export function expiracionDe(token) {
    try {
        const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const { exp } = JSON.parse(atob(payload));
        return typeof exp === "number" ? exp * 1000 : null;
    } catch {
        return null;
    }
}

export function sesionVencida() {
    const refresh = localStorage.getItem(CLAVE_REFRESH);
    const exp = refresh ? expiracionDe(refresh) : null;
    return exp !== null && exp <= Date.now();
}

export function haySesion() {
    if (!hayToken() || !leerUsuario()) return false;
    if (sesionVencida()) {
        limpiarSesion();
        return false;
    }
    return true;
}

export const leerRol = () => (haySesion() ? leerUsuario().rol : null);

// A dónde lleva a cada rol después de iniciar sesión.
export function rutaInicialDe(rol) {
    if (rol === ROL_ADMIN) return "/admin";
    if (rol === ROL_VENDEDOR) return "/vendedor/productos";
    return "/";
}

export function limpiarSesion() {
    [CLAVE_TOKEN, CLAVE_REFRESH, CLAVE_USUARIO].forEach((k) => localStorage.removeItem(k));
}