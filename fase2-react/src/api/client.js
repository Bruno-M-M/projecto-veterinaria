import axios from "axios";
import { CLAVE_TOKEN, guardarSesion, leerRefresh, limpiarSesion } from "./session";
export { CLAVE_TOKEN };

// Separado para poder probarlo: en jsdom no se puede reemplazar window.location.
export const navegacion = {
    irALogin: () => window.location.assign("/login"),
};

export function agregarToken(config) {
    const token = localStorage.getItem(CLAVE_TOKEN);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}

const clienteApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "",
});

clienteApi.interceptors.request.use(agregarToken);
let renovacionEnCurso = null;

clienteApi.interceptors.response.use(
    (respuesta) => respuesta,
    async (error) => {
        const original = error.config;
        const esRutaAuth = original?.url?.includes("/auth/");
        if (error.response?.status !== 401 || !original || original._reintento || esRutaAuth) {
            return Promise.reject(error);
        }
        original._reintento = true;
        try {
            const refreshToken = leerRefresh();
            if (!refreshToken) throw error;
            renovacionEnCurso =
                renovacionEnCurso ||
                axios
                    .post(`${clienteApi.defaults.baseURL}/api/v1/auth/refresh`, { refreshToken })
                    .finally(() => { renovacionEnCurso = null; });
            const { data } = await renovacionEnCurso;
            guardarSesion(data);
            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return clienteApi(original);
        } catch (e) {
            limpiarSesion();
            navegacion.irALogin();
            return Promise.reject(e);
        }
    }
);
export default clienteApi;