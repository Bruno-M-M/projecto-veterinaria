import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProductosProvider } from "../context/ProductosContext.jsx";
import { CarritoProvider } from "../context/CarritoContext.jsx";
import DetalleProducto from "./DetalleProducto.jsx";

const api = vi.hoisted(() => ({ listarProductos: vi.fn() }));
const apiCategorias = vi.hoisted(() => ({ listarCategorias: vi.fn() }));
vi.mock("../api/productos.js", () => api);
vi.mock("../api/categorias.js", () => apiCategorias);

const producto = (extra) => ({ descripcion: "Descripción", precio: 4200, stock: 10, stockCritico: 2, activo: true, categoriaId: 1, categoria: "Antibióticos", ...extra });
const AMOXIBAY = producto({ id: 1, codigo: "ME001", nombre: "Amoxibay 250mg", descripcion: "Amoxicilina en comprimidos" });
const ENROX = producto({ id: 2, codigo: "ME002", nombre: "Enrox 50mg", precio: 6800 });
const BRAVECTO = producto({ id: 5, codigo: "ME005", nombre: "Bravecto", categoriaId: 2, categoria: "Antiparasitarios" });
const DESACTIVADO = producto({ id: 99, codigo: "ZZ099", nombre: "Producto desactivado", activo: false });

function montar(codigo = "ME001") {
    return render(
        <MemoryRouter initialEntries={[`/producto/${codigo}`]}>
            <ProductosProvider>
                <CarritoProvider>
                    <Routes>
                        <Route path="/producto/:codigo" element={<DetalleProducto />} />
                        <Route path="/productos" element={<p>Lista de la tienda</p>} />
                    </Routes>
                </CarritoProvider>
            </ProductosProvider>
        </MemoryRouter>
    );
}

describe("DetalleProducto", () => {
    beforeEach(() => {
        localStorage.clear();
        api.listarProductos.mockReset();
        apiCategorias.listarCategorias.mockReset();
        api.listarProductos.mockResolvedValue([AMOXIBAY, ENROX, BRAVECTO, DESACTIVADO]);
        apiCategorias.listarCategorias.mockResolvedValue([]);
    });

    describe("producto activo", () => {
        test("muestra el nombre, la categoría, la descripción y el precio", async () => {
            montar();
            expect(await screen.findByRole("heading", { name: "Amoxibay 250mg" })).toBeInTheDocument();
            expect(screen.getByText("Antibióticos")).toBeInTheDocument();
            expect(screen.getByText("Amoxicilina en comprimidos")).toBeInTheDocument();
            expect(screen.getByText("$4.200")).toBeInTheDocument();
        });

        test("sugiere solo productos activos de la misma categoría", async () => {
            montar();
            await screen.findByRole("heading", { name: "Amoxibay 250mg" });
            expect(screen.getByText("Enrox 50mg")).toBeInTheDocument();
            expect(screen.queryByText("Bravecto")).not.toBeInTheDocument();
            expect(screen.queryByText("Producto desactivado")).not.toBeInTheDocument();
        });

        test("agregar al carrito guarda la cantidad elegida", async () => {
            montar();
            await screen.findByRole("heading", { name: "Amoxibay 250mg" });
            await userEvent.click(screen.getByText("+"));
            await userEvent.click(screen.getByText("Agregar al carrito"));
            const guardado = JSON.parse(localStorage.getItem("carrito"));
            expect(guardado).toEqual([expect.objectContaining({ producto: "ME001", productoId: 1, cantidad: 2 })]);
        });

        test("la cantidad no pasa del stock disponible", async () => {
            api.listarProductos.mockResolvedValue([producto({ id: 7, codigo: "ME007", nombre: "Poco stock", stock: 2 })]);
            montar("ME007");
            await screen.findByRole("heading", { name: "Poco stock" });
            const mas = screen.getByText("+");
            await userEvent.click(mas);
            expect(mas).toBeDisabled();
        });

        test("un producto sin stock no se puede agregar", async () => {
            api.listarProductos.mockResolvedValue([producto({ id: 21, codigo: "ME021", nombre: "Omega vet", stock: 0 })]);
            montar("ME021");
            await screen.findByRole("heading", { name: "Omega vet" });
            expect(screen.getByText("Sin stock")).toBeDisabled();
        });
    });

    describe("producto que no se puede ver", () => {
        test("un producto desactivado se trata como si no existiera", async () => {
            montar("ZZ099");
            expect(await screen.findByText(/No encontramos el producto que buscabas/)).toBeInTheDocument();
            expect(screen.queryByText("Producto desactivado")).not.toBeInTheDocument();
        });

        test("un código que no existe lo avisa y ofrece volver a la tienda", async () => {
            montar("NOEXI");
            expect(await screen.findByText(/No encontramos el producto que buscabas/)).toBeInTheDocument();
            expect(screen.getByText("Ver todos los productos")).toHaveAttribute("href", "/productos");
        });
    });

    describe("estados de carga", () => {
        test("mientras llegan los datos no dice que el producto no existe", () => {
            api.listarProductos.mockReturnValue(new Promise(() => {}));
            montar();
            expect(screen.getByText("Cargando producto...")).toBeInTheDocument();
            expect(screen.queryByText(/No encontramos el producto/)).not.toBeInTheDocument();
        });

        test("si la API falla muestra el error y no el aviso de inexistente", async () => {
            api.listarProductos.mockRejectedValue(new Error("sin conexión"));
            montar();
            expect(await screen.findByText(/no se pudieron cargar los productos/i)).toBeInTheDocument();
            expect(screen.queryByText(/No encontramos el producto/)).not.toBeInTheDocument();
        });
    });
});
