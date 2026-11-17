export function mensajeDeError(error, porDefecto = "Ocurrió un error inesperado.") {
    if (!error?.response) return "No se pudo conectar con el servidor.";
    const { mensaje, errores } = error.response.data ?? {};
    if (errores && Object.keys(errores).length > 0) {
        return Object.values(errores).join(" ");
    }
    return mensaje ?? porDefecto;
}