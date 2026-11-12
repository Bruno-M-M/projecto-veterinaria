import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ProductosProvider } from "../../context/ProductosContext.jsx";
import AdminProductos from "./AdminProductos.jsx";

const api = vi.hoisted(() => ({
    listarProductos: vi.fn(),
    crearProducto: vi.fn(),
    actualizarProducto: vi.fn(),
    eliminarProducto: vi.fn(),
}));
const apiCategorias = vi.hoisted(() => ({ listarCategorias: vi.fn() }));
vi.mock("../../api/productos.js", () => api);
vi.mock("../../api/categorias.js", () => apiCategorias);

const AMOXIBAY = { id: 1, codigo: "ME001", nombre: "Amoxibay 250mg", descripcion: "Antibiótico", categoria: "Antibióticos", categoriaId: 1, precio: 10000, stock: 45, stockCritico: 10, activo: true };
const BRAVECTO = { id: 5, codigo: "ME005", nombre: "Bravecto", descripcion: "Antiparasitario", categoria: "Antiparasitarios", categoriaId: 2, precio: 18900, stock: 4, stockCritico: 10, activo: true };

function montar(productos = [AMOXIBAY, BRAVECTO]) {
    api.listarProductos.mockResolvedValue(productos);
    return render(
        <MemoryRouter>
            <ProductosProvider>
                <AdminProductos />
            </ProductosProvider>
        </MemoryRouter>
    );
}

describe("AdminProductos", () => {
    beforeEach(() => {
        Object.values(api).forEach((funcion) => funcion.mockReset());
        apiCategorias.listarCategorias.mockReset();
        apiCategorias.listarCategorias.mockResolvedValue([]);
    });

    describe("la lista", () => {
        test("muestra una fila por producto con categoría y precio formateados", async () => {
            montar();
            const fila = (await screen.findByText("Amoxibay 250mg")).closest("tr");
            expect(within(fila).getByText("Antibióticos")).toBeInTheDocument();
            expect(within(fila).getByText("$10.000")).toBeInTheDocument();
            expect(screen.getByText("Bravecto")).toBeInTheDocument();
        });

        test("marca Stock crítico solo en los productos con stock bajo", async () => {
            montar();
            await screen.findByText("Bravecto");
            expect(screen.getAllByText("Stock crítico").length).toBe(1);
            const fila = screen.getByText("Bravecto").closest("tr");
            expect(within(fila).getByText("Stock crítico")).toBeInTheDocument();
        });

        test("mientras llegan los datos muestra un aviso de carga y no la tabla", () => {
            api.listarProductos.mockReturnValue(new Promise(() => {}));
            render(<MemoryRouter><ProductosProvider><AdminProductos /></ProductosProvider></MemoryRouter>);
            expect(screen.getByText("Cargando productos...")).toBeInTheDocument();
            expect(screen.queryByText("No hay productos registrados.")).not.toBeInTheDocument();
        });

        test("si la API falla muestra el error en lugar de la tabla", async () => {
            api.listarProductos.mockRejectedValue(new Error("sin conexión"));
            render(<MemoryRouter><ProductosProvider><AdminProductos /></ProductosProvider></MemoryRouter>);
            expect(await screen.findByText(/no se pudieron cargar los productos/i)).toBeInTheDocument();
            expect(screen.queryByRole("table")).not.toBeInTheDocument();
        });

        test("sin productos muestra un mensaje en lugar de la tabla", async () => {
            montar([]);
            expect(await screen.findByText("No hay productos registrados.")).toBeInTheDocument();
        });
    });

    describe("los enlaces", () => {
        test("el botón Nuevo producto lleva al formulario", async () => {
            montar([AMOXIBAY]);
            expect(await screen.findByText("+ Nuevo producto")).toHaveAttribute("href", "/admin/productos/nuevo");
        });

        test("Editar lleva a la pantalla de edición de ese producto", async () => {
            montar();
            const enlace = await screen.findByLabelText("Editar Bravecto");
            expect(enlace).toHaveAttribute("href", "/admin/productos/ME005/editar");
        });
    });

    describe("eliminar", () => {
        test("con confirmación llama a la API con el id y quita el producto de la tabla", async () => {
            vi.spyOn(window, "confirm").mockReturnValue(true);
            api.eliminarProducto.mockResolvedValue();
            montar();
            await userEvent.click(await screen.findByLabelText("Eliminar Bravecto"));
            await waitFor(() => expect(screen.queryByText("Bravecto")).not.toBeInTheDocument());
            expect(api.eliminarProducto).toHaveBeenCalledWith(5);
            expect(screen.getByText("Amoxibay 250mg")).toBeInTheDocument();
        });

        test("si se cancela la confirmación no llama a la API y el producto sigue", async () => {
            vi.spyOn(window, "confirm").mockReturnValue(false);
            montar();
            await userEvent.click(await screen.findByLabelText("Eliminar Bravecto"));
            expect(window.confirm).toHaveBeenCalled();
            expect(api.eliminarProducto).not.toHaveBeenCalled();
            expect(screen.getByText("Bravecto")).toBeInTheDocument();
        });

        test("si la API rechaza muestra el mensaje del servidor y el producto sigue", async () => {
            vi.spyOn(window, "confirm").mockReturnValue(true);
            api.eliminarProducto.mockRejectedValue({ response: { data: { mensaje: "No existe el producto con id 5." } } });
            montar();
            await userEvent.click(await screen.findByLabelText("Eliminar Bravecto"));
            expect(await screen.findByText("No existe el producto con id 5.")).toBeInTheDocument();
            expect(screen.getByText("Bravecto")).toBeInTheDocument();
        });

        test("si no hay conexión avisa que no se pudo conectar", async () => {
            vi.spyOn(window, "confirm").mockReturnValue(true);
            api.eliminarProducto.mockRejectedValue({ request: {} });
            montar();
            await userEvent.click(await screen.findByLabelText("Eliminar Bravecto"));
            expect(await screen.findByText("No se pudo conectar con el servidor.")).toBeInTheDocument();
        });

        test("el aviso de error se puede cerrar", async () => {
            vi.spyOn(window, "confirm").mockReturnValue(true);
            api.eliminarProducto.mockRejectedValue({ request: {} });
            montar();
            await userEvent.click(await screen.findByLabelText("Eliminar Bravecto"));
            await screen.findByText("No se pudo conectar con el servidor.");
            await userEvent.click(screen.getByLabelText("Close alert"));
            expect(screen.queryByText("No se pudo conectar con el servidor.")).not.toBeInTheDocument();
        });
    });
});
