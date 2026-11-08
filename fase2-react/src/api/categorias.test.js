import { describe, test, expect, beforeEach, vi } from "vitest";
import { listarCategorias } from "./categorias.js";

const cliente = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("./client.js", () => ({ default: cliente }));

describe("api/categorias", () => {
    beforeEach(() => {
        cliente.get.mockReset();
    });

    test("listarCategorias pide GET /api/v1/categorias y devuelve la lista", async () => {
        cliente.get.mockResolvedValue({ data: [{ id: 1, nombre: "Antibióticos" }] });
        await expect(listarCategorias()).resolves.toEqual([{ id: 1, nombre: "Antibióticos" }]);
        expect(cliente.get).toHaveBeenCalledWith("/api/v1/categorias");
    });

    test("si la API falla, el error llega a quien llamó", async () => {
        const error = new Error("sin conexión");
        cliente.get.mockRejectedValue(error);
        await expect(listarCategorias()).rejects.toBe(error);
    });
});
