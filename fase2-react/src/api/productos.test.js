import { describe, test, expect, beforeEach, vi } from "vitest";
import { listarProductos, crearProducto, actualizarProducto, eliminarProducto } from "./productos.js";

const cliente = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock("./client.js", () => ({ default: cliente }));

const DATOS = { codigo: "ZZ999", nombre: "Producto de prueba", precio: 12000 };

describe("api/productos", () => {
    beforeEach(() => {
        Object.values(cliente).forEach((funcion) => funcion.mockReset());
    });

    test("listarProductos pide GET /api/v1/productos y devuelve la lista", async () => {
        cliente.get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });
        await expect(listarProductos()).resolves.toEqual([{ id: 1 }, { id: 2 }]);
        expect(cliente.get).toHaveBeenCalledWith("/api/v1/productos");
    });

    test("crearProducto envía POST con los datos y devuelve el producto creado", async () => {
        cliente.post.mockResolvedValue({ data: { id: 30, ...DATOS } });
        await expect(crearProducto(DATOS)).resolves.toEqual({ id: 30, ...DATOS });
        expect(cliente.post).toHaveBeenCalledWith("/api/v1/productos", DATOS);
    });

    test("actualizarProducto envía PUT a la ruta del id con los datos", async () => {
        cliente.put.mockResolvedValue({ data: { id: 5, ...DATOS } });
        await expect(actualizarProducto(5, DATOS)).resolves.toEqual({ id: 5, ...DATOS });
        expect(cliente.put).toHaveBeenCalledWith("/api/v1/productos/5", DATOS);
    });

    test("eliminarProducto envía DELETE a la ruta del id y no devuelve nada", async () => {
        cliente.delete.mockResolvedValue({ status: 204 });
        await expect(eliminarProducto(5)).resolves.toBeUndefined();
        expect(cliente.delete).toHaveBeenCalledWith("/api/v1/productos/5");
    });

    test("si la API falla, el error llega a quien llamó", async () => {
        const error = { response: { status: 409 } };
        cliente.post.mockRejectedValue(error);
        await expect(crearProducto(DATOS)).rejects.toBe(error);
    });
});
