import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductosProvider, useProductos } from "./ProductosContext.jsx";

const api = vi.hoisted(() => ({ listarProductos: vi.fn() }));
vi.mock("../api/productos.js", () => api);

const RESPUESTA = [
    { id: 1, codigo: "ME001", nombre: "Amoxibay 250mg", descripcion: "Antibiótico", precio: 4200, stock: 45, stockCritico: 10, activo: true, categoriaId: 1, categoria: "Antibióticos" },
    { id: 16, codigo: "ME016", nombre: "Vetmedin 2.5mg", descripcion: "Cardíaco", precio: 28000, stock: 15, stockCritico: 5, activo: true, categoriaId: 6, categoria: "Cardíaco" },
];
const NUEVO = { codigo: "ZZ999", nombre: "Producto de prueba", precio: 12000, stock: 5, categoria: "vacunas" };

function Sonda() {
    const { productos, cargando, error, agregarProducto, eliminarProducto } = useProductos();
    const existe = (codigo) => productos.some((p) => p.codigo === codigo);
    return (
        <div>
            <span data-testid="estado">{cargando ? "cargando" : "listo"}</span>
            <span data-testid="error">{error}</span>
            <span data-testid="cantidad">{productos.length}</span>
            <span data-testid="categorias">{productos.map((p) => p.categoria).join(",")}</span>
            <span data-testid="ids">{productos.map((p) => p.id).join(",")}</span>
            <span data-testid="hay-nuevo">{String(existe("ZZ999"))}</span>
            <span data-testid="hay-me001">{String(existe("ME001"))}</span>
            <button onClick={() => agregarProducto(NUEVO)}>agregar</button>
            <button onClick={() => eliminarProducto("ME001")}>eliminar ME001</button>
            <button onClick={() => eliminarProducto("NO-EXISTE")}>eliminar inexistente</button>
        </div>
    );
}

const montar = () => render(<ProductosProvider><Sonda /></ProductosProvider>);
const ver = (id) => screen.getByTestId(id).textContent;
const clic = (texto) => userEvent.click(screen.getByText(texto));
const esperarCarga = () => waitFor(() => expect(ver("estado")).toBe("listo"));

describe("ProductosContext", () => {
    beforeEach(() => {
        api.listarProductos.mockReset();
        api.listarProductos.mockResolvedValue(RESPUESTA);
    });

    test("mientras llegan los datos está cargando y la lista vacía", () => {
        api.listarProductos.mockReturnValue(new Promise(() => {}));
        montar();
        expect(ver("estado")).toBe("cargando");
        expect(ver("cantidad")).toBe("0");
    });

    test("al cargar guarda los productos que entrega la API", async () => {
        montar();
        await esperarCarga();
        expect(api.listarProductos).toHaveBeenCalledTimes(1);
        expect(ver("cantidad")).toBe("2");
        expect(ver("ids")).toBe("1,16");
        expect(ver("error")).toBe("");
    });

    test("convierte el nombre de la categoría en su identificador", async () => {
        montar();
        await esperarCarga();
        expect(ver("categorias")).toBe("antibioticos,cardiaco");
    });

    test("si la API falla deja un mensaje de error y deja de cargar", async () => {
        api.listarProductos.mockRejectedValue(new Error("sin conexión"));
        montar();
        await esperarCarga();
        expect(ver("error")).toMatch(/no se pudieron cargar los productos/i);
        expect(ver("cantidad")).toBe("0");
    });

    test("agregarProducto suma el producto a la lista", async () => {
        montar();
        await esperarCarga();
        await clic("agregar");
        expect(ver("cantidad")).toBe("3");
        expect(ver("hay-nuevo")).toBe("true");
    });

    test("eliminarProducto quita solo el producto con ese código", async () => {
        montar();
        await esperarCarga();
        await clic("eliminar ME001");
        expect(ver("hay-me001")).toBe("false");
        expect(ver("cantidad")).toBe("1");
    });

    test("eliminar un código que no existe no cambia la lista", async () => {
        montar();
        await esperarCarga();
        await clic("eliminar inexistente");
        expect(ver("cantidad")).toBe("2");
    });

    test("no usa localStorage para guardar los productos", async () => {
        const espia = vi.spyOn(Storage.prototype, "setItem");
        montar();
        await esperarCarga();
        await clic("agregar");
        expect(espia).not.toHaveBeenCalledWith("productosGuardados", expect.anything());
    });

    test("useProductos fuera del ProductosProvider lanza un error claro", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => render(<Sonda />)).toThrowError(/ProductosProvider/);
    });
});