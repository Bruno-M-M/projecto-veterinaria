import { useState } from "react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductosProvider, useProductos } from "./ProductosContext.jsx";

const api = vi.hoisted(() => ({
    listarProductos: vi.fn(),
    crearProducto: vi.fn(),
    actualizarProducto: vi.fn(),
    eliminarProducto: vi.fn(),
}));
const apiCategorias = vi.hoisted(() => ({ listarCategorias: vi.fn() }));
vi.mock("../api/productos.js", () => api);
vi.mock("../api/categorias.js", () => apiCategorias);

const RESPUESTA = [
    { id: 1, codigo: "ME001", nombre: "Amoxibay 250mg", descripcion: "Antibiótico", precio: 4200, stock: 45, stockCritico: 10, activo: true, categoriaId: 1, categoria: "Antibióticos" },
    { id: 16, codigo: "ME016", nombre: "Vetmedin 2.5mg", descripcion: "Cardíaco", precio: 28000, stock: 15, stockCritico: 5, activo: true, categoriaId: 6, categoria: "Cardíaco" },
];
const CATEGORIAS = [
    { id: 1, nombre: "Antibióticos" },
    { id: 6, nombre: "Cardíaco" },
    { id: 9, nombre: "Vacunas" },
];

const FORMULARIO_NUEVO = {
    codigo: "ZZ999", nombre: "Producto de prueba", descripcion: "Una descripción",
    precio: "12000", stock: "5", stockCritico: "2", categoria: "vacunas",
};
const CREADO = {
    id: 30, codigo: "ZZ999", nombre: "Producto de prueba", descripcion: "Una descripción",
    precio: 12000, stock: 5, stockCritico: 2, activo: true, categoriaId: 9, categoria: "Vacunas",
};
const FORMULARIO_EDITADO = {
    codigo: "ME001", nombre: "Amoxibay editado", descripcion: "Antibiótico",
    precio: "5000", stock: "45", stockCritico: "10", categoria: "antibioticos",
};

function Sonda() {
    const { productos, categorias, cargando, error, agregarProducto, editarProducto, eliminarProducto } = useProductos();
    const [fallo, setFallo] = useState("");

    async function intentar(accion) {
        try {
            await accion();
            setFallo("");
        } catch (e) {
            setFallo(e.message);
        }
    }

    return (
        <div>
            <span data-testid="estado">{cargando ? "cargando" : "listo"}</span>
            <span data-testid="error">{error}</span>
            <span data-testid="fallo">{fallo}</span>
            <span data-testid="cantidad">{productos.length}</span>
            <span data-testid="categorias-api">{categorias.length}</span>
            <span data-testid="categorias">{productos.map((p) => p.categoria).join(",")}</span>
            <span data-testid="ids">{productos.map((p) => p.id).join(",")}</span>
            <span data-testid="nombres">{productos.map((p) => p.nombre).join(",")}</span>
            <button onClick={() => intentar(() => agregarProducto(FORMULARIO_NUEVO))}>agregar</button>
            <button onClick={() => intentar(() => editarProducto(1, FORMULARIO_EDITADO))}>editar</button>
            <button onClick={() => intentar(() => eliminarProducto(1))}>eliminar</button>
        </div>
    );
}

const montar = () => render(<ProductosProvider><Sonda /></ProductosProvider>);
const ver = (id) => screen.getByTestId(id).textContent;
const clic = (texto) => userEvent.click(screen.getByText(texto));
const esperarCarga = () => waitFor(() => expect(ver("estado")).toBe("listo"));

describe("ProductosContext", () => {
    beforeEach(() => {
        Object.values(api).forEach((funcion) => funcion.mockReset());
        apiCategorias.listarCategorias.mockReset();
        api.listarProductos.mockResolvedValue(RESPUESTA);
        apiCategorias.listarCategorias.mockResolvedValue(CATEGORIAS);
    });

    describe("carga inicial", () => {
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

        test("guarda también las categorías de la API", async () => {
            montar();
            await esperarCarga();
            expect(apiCategorias.listarCategorias).toHaveBeenCalledTimes(1);
            expect(ver("categorias-api")).toBe("3");
        });

        test("si la API de productos falla deja un mensaje de error y deja de cargar", async () => {
            api.listarProductos.mockRejectedValue(new Error("sin conexión"));
            montar();
            await esperarCarga();
            expect(ver("error")).toMatch(/no se pudieron cargar los productos/i);
            expect(ver("cantidad")).toBe("0");
        });

        test("si fallan las categorías también deja el mensaje de error", async () => {
            apiCategorias.listarCategorias.mockRejectedValue(new Error("sin conexión"));
            montar();
            await esperarCarga();
            expect(ver("error")).toMatch(/no se pudieron cargar los productos/i);
        });
    });

    describe("agregarProducto", () => {
        test("envía a la API los datos como números y con el id de la categoría", async () => {
            api.crearProducto.mockResolvedValue(CREADO);
            montar();
            await esperarCarga();
            await clic("agregar");
            await waitFor(() => expect(ver("cantidad")).toBe("3"));
            expect(api.crearProducto).toHaveBeenCalledWith({
                codigo: "ZZ999",
                nombre: "Producto de prueba",
                descripcion: "Una descripción",
                precio: 12000,
                stock: 5,
                stockCritico: 2,
                activo: true,
                categoriaId: 9,
            });
        });

        test("suma a la lista lo que respondió el servidor, con su id", async () => {
            api.crearProducto.mockResolvedValue(CREADO);
            montar();
            await esperarCarga();
            await clic("agregar");
            await waitFor(() => expect(ver("ids")).toBe("1,16,30"));
            expect(ver("categorias")).toBe("antibioticos,cardiaco,vacunas");
        });

        test("si la API rechaza, el error llega a quien llamó y la lista no cambia", async () => {
            api.crearProducto.mockRejectedValue(new Error("Ya existe un producto con el codigo ZZ999."));
            montar();
            await esperarCarga();
            await clic("agregar");
            await waitFor(() => expect(ver("fallo")).toBe("Ya existe un producto con el codigo ZZ999."));
            expect(ver("cantidad")).toBe("2");
        });
    });

    describe("editarProducto", () => {
        test("envía los datos a la API con el id del producto y el de su categoría", async () => {
            api.actualizarProducto.mockResolvedValue({ ...RESPUESTA[0], nombre: "Amoxibay editado", precio: 5000 });
            montar();
            await esperarCarga();
            await clic("editar");
            await waitFor(() => expect(api.actualizarProducto).toHaveBeenCalledTimes(1));
            expect(api.actualizarProducto).toHaveBeenCalledWith(1, {
                codigo: "ME001",
                nombre: "Amoxibay editado",
                descripcion: "Antibiótico",
                precio: 5000,
                stock: 45,
                stockCritico: 10,
                activo: true,
                categoriaId: 1,
            });
        });

        test("reemplaza ese producto en la lista y deja los demás", async () => {
            api.actualizarProducto.mockResolvedValue({ ...RESPUESTA[0], nombre: "Amoxibay editado" });
            montar();
            await esperarCarga();
            await clic("editar");
            await waitFor(() => expect(ver("nombres")).toBe("Amoxibay editado,Vetmedin 2.5mg"));
            expect(ver("cantidad")).toBe("2");
        });

        test("si la API rechaza, la lista queda como estaba", async () => {
            api.actualizarProducto.mockRejectedValue(new Error("No existe el producto con id 1."));
            montar();
            await esperarCarga();
            await clic("editar");
            await waitFor(() => expect(ver("fallo")).toBe("No existe el producto con id 1."));
            expect(ver("nombres")).toBe("Amoxibay 250mg,Vetmedin 2.5mg");
        });
    });

    describe("eliminarProducto", () => {
        test("llama a la API con el id y quita ese producto de la lista", async () => {
            api.eliminarProducto.mockResolvedValue();
            montar();
            await esperarCarga();
            await clic("eliminar");
            await waitFor(() => expect(ver("ids")).toBe("16"));
            expect(api.eliminarProducto).toHaveBeenCalledWith(1);
        });

        test("si la API rechaza, el producto sigue en la lista", async () => {
            api.eliminarProducto.mockRejectedValue(new Error("No existe el producto con id 1."));
            montar();
            await esperarCarga();
            await clic("eliminar");
            await waitFor(() => expect(ver("fallo")).toBe("No existe el producto con id 1."));
            expect(ver("ids")).toBe("1,16");
        });
    });

    test("no usa localStorage para guardar los productos", async () => {
        api.crearProducto.mockResolvedValue(CREADO);
        const espia = vi.spyOn(Storage.prototype, "setItem");
        montar();
        await esperarCarga();
        await clic("agregar");
        await waitFor(() => expect(ver("cantidad")).toBe("3"));
        expect(espia).not.toHaveBeenCalledWith("productosGuardados", expect.anything());
    });

    test("useProductos fuera del ProductosProvider lanza un error claro", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => render(<Sonda />)).toThrowError(/ProductosProvider/);
    });
});
