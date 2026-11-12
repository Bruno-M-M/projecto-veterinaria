import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProductosProvider } from "../../context/ProductosContext.jsx";
import EditarProducto from "./EditarProducto.jsx";

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
const CATEGORIAS = [
    { id: 1, nombre: "Antibióticos" },
    { id: 2, nombre: "Antiparasitarios" },
];

async function montar(codigo = "ME005", productos = [AMOXIBAY, BRAVECTO]) {
    api.listarProductos.mockResolvedValue(productos);
    render(
        <MemoryRouter initialEntries={[`/admin/productos/${codigo}/editar`]}>
            <ProductosProvider>
                <Routes>
                    <Route path="/admin/productos/:codigo/editar" element={<EditarProducto />} />
                    <Route path="/admin/productos" element={<p>Lista de productos</p>} />
                </Routes>
            </ProductosProvider>
        </MemoryRouter>
    );
    await act(async () => {});
}

async function escribir(etiqueta, valor) {
    const campo = screen.getByLabelText(etiqueta);
    await userEvent.clear(campo);
    if (valor !== "") await userEvent.type(campo, valor);
}
const guardar = () => userEvent.click(screen.getByText("Guardar cambios"));

describe("EditarProducto", () => {
    beforeEach(() => {
        Object.values(api).forEach((funcion) => funcion.mockReset());
        apiCategorias.listarCategorias.mockReset();
        apiCategorias.listarCategorias.mockResolvedValue(CATEGORIAS);
    });

    describe("cargar el producto", () => {
        test("mientras llegan los datos muestra un aviso y no el formulario", () => {
            api.listarProductos.mockReturnValue(new Promise(() => {}));
            render(
                <MemoryRouter initialEntries={["/admin/productos/ME005/editar"]}>
                    <ProductosProvider>
                        <Routes>
                            <Route path="/admin/productos/:codigo/editar" element={<EditarProducto />} />
                        </Routes>
                    </ProductosProvider>
                </MemoryRouter>
            );
            expect(screen.getByText("Cargando producto...")).toBeInTheDocument();
            expect(screen.queryByLabelText("Código")).not.toBeInTheDocument();
        });

        test("rellena el formulario con los datos del producto", async () => {
            await montar();
            expect(screen.getByRole("heading", { name: "Editar producto" })).toBeInTheDocument();
            expect(screen.getByLabelText("Código")).toHaveValue("ME005");
            expect(screen.getByLabelText("Nombre")).toHaveValue("Bravecto");
            expect(screen.getByLabelText("Descripción")).toHaveValue("Antiparasitario");
            expect(screen.getByLabelText("Precio")).toHaveValue(18900);
            expect(screen.getByLabelText("Stock")).toHaveValue(4);
            expect(screen.getByLabelText("Stock crítico")).toHaveValue(10);
            expect(screen.getByLabelText("Categoría")).toHaveValue("antiparasitarios");
            expect(screen.getByText("Guardar cambios")).toBeInTheDocument();
        });

        test("un código que no existe lo avisa y ofrece volver a la lista", async () => {
            await montar("ZZ999");
            expect(screen.getByText(/No existe un producto con el código ZZ999/)).toBeInTheDocument();
            expect(screen.getByText("Volver a la lista")).toHaveAttribute("href", "/admin/productos");
            expect(screen.queryByLabelText("Código")).not.toBeInTheDocument();
        });

        test("si la API falla al cargar muestra el error y no el formulario", async () => {
            api.listarProductos.mockRejectedValue(new Error("sin conexión"));
            render(
                <MemoryRouter initialEntries={["/admin/productos/ME005/editar"]}>
                    <ProductosProvider>
                        <Routes>
                            <Route path="/admin/productos/:codigo/editar" element={<EditarProducto />} />
                        </Routes>
                    </ProductosProvider>
                </MemoryRouter>
            );
            expect(await screen.findByText(/no se pudieron cargar los productos/i)).toBeInTheDocument();
            expect(screen.queryByLabelText("Código")).not.toBeInTheDocument();
        });
    });

    describe("guardar los cambios", () => {
        test("envía a la API el id del producto con los datos cambiados y vuelve a la lista", async () => {
            api.actualizarProducto.mockResolvedValue({ ...BRAVECTO, precio: 20000 });
            await montar();
            await escribir("Precio", "20000");
            await guardar();
            expect(await screen.findByText("Lista de productos")).toBeInTheDocument();
            expect(api.actualizarProducto).toHaveBeenCalledWith(5, {
                codigo: "ME005",
                nombre: "Bravecto",
                descripcion: "Antiparasitario",
                precio: 20000,
                stock: 4,
                stockCritico: 10,
                activo: true,
                categoriaId: 2,
            });
        });

        test("guardar sin cambiar el código no choca con el propio producto", async () => {
            api.actualizarProducto.mockResolvedValue(BRAVECTO);
            await montar();
            await guardar();
            expect(await screen.findByText("Lista de productos")).toBeInTheDocument();
            expect(screen.queryByText("Ya existe un producto con ese código.")).not.toBeInTheDocument();
        });

        test("un producto desactivado sigue desactivado después de editarlo", async () => {
            const inactivo = { ...BRAVECTO, activo: false };
            api.actualizarProducto.mockResolvedValue(inactivo);
            await montar("ME005", [AMOXIBAY, inactivo]);
            await escribir("Nombre", "Bravecto editado");
            await guardar();
            await screen.findByText("Lista de productos");
            expect(api.actualizarProducto.mock.calls[0][1].activo).toBe(false);
        });

        test("se puede cambiar de categoría y se envía el id de la nueva", async () => {
            api.actualizarProducto.mockResolvedValue(BRAVECTO);
            await montar();
            await userEvent.selectOptions(screen.getByLabelText("Categoría"), "antibioticos");
            await guardar();
            await screen.findByText("Lista de productos");
            expect(api.actualizarProducto.mock.calls[0][1].categoriaId).toBe(1);
        });

        test("mientras espera la respuesta el botón queda deshabilitado", async () => {
            api.actualizarProducto.mockReturnValue(new Promise(() => {}));
            await montar();
            await guardar();
            await waitFor(() => expect(screen.getByText("Guardar cambios")).toBeDisabled());
        });
    });

    describe("errores", () => {
        test("usar el código de otro producto lo rechaza sin llamar a la API", async () => {
            await montar();
            await escribir("Código", "ME001");
            await guardar();
            expect(screen.getByText("Ya existe un producto con ese código.")).toBeInTheDocument();
            expect(api.actualizarProducto).not.toHaveBeenCalled();
        });

        test("un campo inválido muestra el error y no llama a la API", async () => {
            await montar();
            await escribir("Nombre", "");
            await guardar();
            expect(screen.getByText("El nombre es requerido.")).toBeInTheDocument();
            expect(api.actualizarProducto).not.toHaveBeenCalled();
        });

        test("un 409 del servidor se muestra bajo el código y no navega", async () => {
            api.actualizarProducto.mockRejectedValue({
                response: { status: 409, data: { mensaje: "Ya existe un producto con el codigo ME010." } },
            });
            await montar();
            await escribir("Código", "ME010");
            await guardar();
            expect(await screen.findByText("Ya existe un producto con el codigo ME010.")).toBeInTheDocument();
            expect(screen.queryByText("Lista de productos")).not.toBeInTheDocument();
        });

        test("si no hay conexión muestra un aviso general y conserva lo escrito", async () => {
            api.actualizarProducto.mockRejectedValue({ request: {} });
            await montar();
            await escribir("Nombre", "Nombre nuevo");
            await guardar();
            expect(await screen.findByText("No se pudo conectar con el servidor.")).toBeInTheDocument();
            expect(screen.getByLabelText("Nombre")).toHaveValue("Nombre nuevo");
        });
    });

    test("Cancelar vuelve a la lista sin guardar", async () => {
        await montar();
        expect(screen.getByText("Cancelar")).toHaveAttribute("href", "/admin/productos");
        expect(api.actualizarProducto).not.toHaveBeenCalled();
    });
});
