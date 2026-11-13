import { describe, test, expect, beforeEach } from "vitest";
import clienteApi, { agregarToken, CLAVE_TOKEN } from "./client.js";

describe("api/client", () => {
    beforeEach(() => localStorage.clear());

    test("el token se guarda con la clave 'token'", () => {
        expect(CLAVE_TOKEN).toBe("token");
    });

    test("agrega la cabecera Authorization con el token guardado", () => {
        localStorage.setItem(CLAVE_TOKEN, "abc.def.ghi");
        const config = agregarToken({ headers: {} });
        expect(config.headers.Authorization).toBe("Bearer abc.def.ghi");
    });

    test("sin token guardado no agrega la cabecera", () => {
        const config = agregarToken({ headers: {} });
        expect(config.headers.Authorization).toBeUndefined();
    });

    test("devuelve la misma configuración para que la petición continúe", () => {
        const config = { headers: {}, url: "/api/v1/productos" };
        expect(agregarToken(config)).toBe(config);
    });

    test("el cliente axios no tiene dirección base propia en desarrollo", () => {
        expect(clienteApi.defaults.baseURL).toBe("");
    });
});
