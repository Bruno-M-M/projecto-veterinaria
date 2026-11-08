import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ProductosProvider } from "../context/ProductosContext.jsx";
import { CarritoProvider } from "../context/CarritoContext.jsx";
import Productos from "./Productos.jsx";

const api = vi.hoisted(() => ({ listarProductos: vi.fn() }));
const apiCategorias = vi.hoisted(() => ({ listarCategorias: vi.fn() }));
vi.mock("../api/productos.js", () => api);
vi.mock("../api/categorias.js", () => apiCategorias);

const producto = (extra) => ({ descripcion: "Descripción", precio: 1000, stock: 10, stockCritico: 2, activo: true, categoriaId: 1, categoria: "Antibióticos", ...extra });
const AMOXIBAY = producto({ id: 1, codigo: "ME001", nombre: "Amoxibay 250mg" });
const BRAVECTO = producto({ id: 5, codigo: "ME005", nombre: "Bravecto", categoriaId: 2, categoria: "Antiparasitarios" });
const DESACTIVADO = producto({ id: 99, codigo: "ZZ099", nombre: "Producto desactivado", activo: false });

function montar() {
    return render(
        <MemoryRouter>
            <ProductosProvider>
                <CarritoProvider>
                    <Productos />
                </CarritoProvider>
            </ProductosProvider>
        </MemoryRouter>
    );
}

describe("Productos (la tienda)", () => {
    beforeEach(() => {
        localStorage.clear();
        api.listarProductos.mockReset();
        apiCategorias.listarCategorias.mockReset();
        api.listarProductos.mockResolvedValue([AMOXIBAY, BRAVECTO, DESACTIVADO]);
        apiCategorias.listarCategorias.mockResolvedValue([]);
    });

    test("muestra los productos activos con su nombre y precio", async () => {
        montar();
        expect(await screen.findByText("Amoxibay 250mg")).toBeInTheDocument();
        expect(screen.getByText("Bravecto")).toBeInTheDocument();
        expect(screen.getAllByText("$1.000").length).toBe(2);
    });

    test("no muestra los productos desactivados", async () => {
        montar();
        await screen.findByText("Amoxibay 250mg");
        expect(screen.queryByText("Producto desactivado")).not.toBeInTheDocument();
    });

    test("el filtro por categoría muestra solo los activos de esa categoría", async () => {
        montar();
        await screen.findByText("Amoxibay 250mg");
        await userEvent.selectOptions(screen.getByRole("combobox"), "antibioticos");
        expect(screen.getByText("Amoxibay 250mg")).toBeInTheDocument();
        expect(screen.queryByText("Bravecto")).not.toBeInTheDocument();
        expect(screen.queryByText("Producto desactivado")).not.toBeInTheDocument();
    });

    test("volver a todas las categorías muestra de nuevo todos los activos", async () => {
        montar();
        await screen.findByText("Amoxibay 250mg");
        await userEvent.selectOptions(screen.getByRole("combobox"), "antibioticos");
        await userEvent.selectOptions(screen.getByRole("combobox"), "todas");
        expect(screen.getByText("Bravecto")).toBeInTheDocument();
        expect(screen.queryByText("Producto desactivado")).not.toBeInTheDocument();
    });

    test("un producto sin stock se muestra con el botón en Sin stock", async () => {
        api.listarProductos.mockResolvedValue([producto({ id: 21, codigo: "ME021", nombre: "Omega vet", stock: 0 })]);
        montar();
        expect(await screen.findByText("Sin stock")).toBeDisabled();
    });

    test("agregar un producto lo suma al carrito guardado", async () => {
        montar();
        const tarjeta = (await screen.findByText("Amoxibay 250mg")).closest(".card");
        await userEvent.click(tarjeta.querySelector("button"));
        const guardado = JSON.parse(localStorage.getItem("carrito"));
        expect(guardado).toEqual([expect.objectContaining({ producto: "ME001", productoId: 1, cantidad: 1 })]);
    });

    test("mientras llegan los datos muestra un aviso de carga", () => {
        api.listarProductos.mockReturnValue(new Promise(() => {}));
        montar();
        expect(screen.getByText("Cargando productos...")).toBeInTheDocument();
    });

    test("si la API falla muestra el error", async () => {
        api.listarProductos.mockRejectedValue(new Error("sin conexión"));
        montar();
        expect(await screen.findByText(/no se pudieron cargar los productos/i)).toBeInTheDocument();
    });
});
