import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProductosProvider } from "../../context/ProductosContext.jsx";
import NuevoProducto from "./NuevoProducto.jsx";

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
const CATEGORIAS = [
    { id: 1, nombre: "Antibióticos" },
    { id: 9, nombre: "Vacunas" },
];
const CREADO = { id: 30, codigo: "ZZ999", nombre: "Producto de prueba", descripcion: "Una descripción", categoria: "Vacunas", categoriaId: 9, precio: 12000, stock: 5, stockCritico: 2, activo: true };
const ERROR_409 = { response: { status: 409, data: { mensaje: "Ya existe un producto con el codigo ZZ999." } } };

async function montar() {
    render(
        <MemoryRouter initialEntries={["/admin/productos/nuevo"]}>
            <ProductosProvider>
                <Routes>
                    <Route path="/admin/productos/nuevo" element={<NuevoProducto />} />
                    <Route path="/admin/productos" element={<p>Lista de productos</p>} />
                </Routes>
            </ProductosProvider>
        </MemoryRouter>
    );
    await act(async () => {});
}

async function escribir(etiqueta, valor) {
    const campo = screen.getByLabelText(etiqueta);
    if (campo.tagName === "SELECT") {
        await userEvent.selectOptions(campo, valor);
        return;
    }
    await userEvent.clear(campo);
    if (valor !== "") await userEvent.type(campo, valor);
}
const crear = () => userEvent.click(screen.getByText("Crear producto"));

async function llenarFormularioValido() {
    await escribir("Código", "ZZ999");
    await escribir("Nombre", "Producto de prueba");
    await escribir("Descripción", "Una descripción");
    await escribir("Precio", "12000");
    await escribir("Stock", "5");
    await escribir("Stock crítico", "2");
    await escribir("Categoría", "vacunas");
}

describe("NuevoProducto", () => {
    beforeEach(() => {
        Object.values(api).forEach((funcion) => funcion.mockReset());
        apiCategorias.listarCategorias.mockReset();
        api.listarProductos.mockResolvedValue([AMOXIBAY]);
        apiCategorias.listarCategorias.mockResolvedValue(CATEGORIAS);
    });

    describe("validación del formulario", () => {
        test("enviar el formulario vacío muestra los errores y no llama a la API", async () => {
            await montar();
            await crear();
            expect(screen.getByText("Debe seleccionar una categoría.")).toBeInTheDocument();
            expect(screen.getByText("El nombre es requerido.")).toBeInTheDocument();
            expect(screen.getByText("La descripción es requerida.")).toBeInTheDocument();
            expect(screen.getByText("El stock es requerido.")).toBeInTheDocument();
            expect(screen.getByText("El stock crítico es requerido.")).toBeInTheDocument();
            expect(screen.queryByText("Lista de productos")).not.toBeInTheDocument();
            expect(api.crearProducto).not.toHaveBeenCalled();
        });

        test("un código que ya existe en la lista muestra el error y no llama a la API", async () => {
            await montar();
            await llenarFormularioValido();
            await escribir("Código", "me001");
            await crear();
            expect(screen.getByText("Ya existe un producto con ese código.")).toBeInTheDocument();
            expect(api.crearProducto).not.toHaveBeenCalled();
        });

        test("un código de más de 5 caracteres muestra el error", async () => {
            await montar();
            await llenarFormularioValido();
            await escribir("Código", "ABCDEF");
            await crear();
            expect(screen.getByText("El código no puede superar los 5 caracteres.")).toBeInTheDocument();
        });

        test("un precio negativo muestra el error", async () => {
            await montar();
            await llenarFormularioValido();
            await escribir("Precio", "-5");
            await crear();
            expect(screen.getByText("El precio no puede ser negativo.")).toBeInTheDocument();
        });

        test("al escribir en un campo con error, ese error desaparece", async () => {
            await montar();
            await crear();
            expect(screen.getByText("El nombre es requerido.")).toBeInTheDocument();
            await escribir("Nombre", "Algo");
            expect(screen.queryByText("El nombre es requerido.")).not.toBeInTheDocument();
        });
    });

    describe("crear el producto", () => {
        test("con datos válidos envía a la API los números y el id de la categoría, y vuelve a la lista", async () => {
            api.crearProducto.mockResolvedValue(CREADO);
            await montar();
            await llenarFormularioValido();
            await crear();
            expect(await screen.findByText("Lista de productos")).toBeInTheDocument();
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

        test("quita los espacios al principio y al final de los textos", async () => {
            api.crearProducto.mockResolvedValue(CREADO);
            await montar();
            await llenarFormularioValido();
            await escribir("Código", "  ZZ999  ");
            await escribir("Nombre", "  Producto de prueba  ");
            await crear();
            await screen.findByText("Lista de productos");
            const enviado = api.crearProducto.mock.calls[0][0];
            expect(enviado.codigo).toBe("ZZ999");
            expect(enviado.nombre).toBe("Producto de prueba");
        });

        test("mientras espera la respuesta el botón queda deshabilitado", async () => {
            api.crearProducto.mockReturnValue(new Promise(() => {}));
            await montar();
            await llenarFormularioValido();
            await crear();
            await waitFor(() => expect(screen.getByText("Crear producto")).toBeDisabled());
        });
    });

    describe("errores del servidor", () => {
        test("un 409 muestra el mensaje bajo el código y no navega", async () => {
            api.crearProducto.mockRejectedValue(ERROR_409);
            await montar();
            await llenarFormularioValido();
            await crear();
            expect(await screen.findByText("Ya existe un producto con el codigo ZZ999.")).toBeInTheDocument();
            expect(screen.queryByText("Lista de productos")).not.toBeInTheDocument();
            expect(screen.getByText("Crear producto")).not.toBeDisabled();
        });

        test("un 400 muestra cada mensaje bajo su campo", async () => {
            api.crearProducto.mockRejectedValue({
                response: {
                    status: 400,
                    data: { mensaje: "Hay datos inválidos.", errores: { nombre: "El nombre no puede pasar los 60 caracteres." } },
                },
            });
            await montar();
            await llenarFormularioValido();
            await crear();
            expect(await screen.findByText("El nombre no puede pasar los 60 caracteres.")).toBeInTheDocument();
            expect(screen.queryByText("Lista de productos")).not.toBeInTheDocument();
        });

        test("si no hay conexión muestra un aviso general y no navega", async () => {
            api.crearProducto.mockRejectedValue({ request: {} });
            await montar();
            await llenarFormularioValido();
            await crear();
            expect(await screen.findByText("No se pudo conectar con el servidor.")).toBeInTheDocument();
            expect(screen.queryByText("Lista de productos")).not.toBeInTheDocument();
        });

        test("tras un error se puede corregir y volver a intentar", async () => {
            api.crearProducto.mockRejectedValueOnce(ERROR_409).mockResolvedValueOnce(CREADO);
            await montar();
            await llenarFormularioValido();
            await crear();
            await screen.findByText("Ya existe un producto con el codigo ZZ999.");
            await crear();
            expect(await screen.findByText("Lista de productos")).toBeInTheDocument();
        });
    });

    test("las etiquetas ya no dicen opcional: descripción y stock crítico son obligatorios", async () => {
        await montar();
        expect(screen.getByLabelText("Descripción")).toBeInTheDocument();
        expect(screen.getByLabelText("Stock crítico")).toBeInTheDocument();
        expect(screen.queryByText(/opcional/i)).not.toBeInTheDocument();
    });

    test("Cancelar vuelve a la lista sin guardar", async () => {
        await montar();
        expect(screen.getByText("Cancelar")).toHaveAttribute("href", "/admin/productos");
        expect(api.crearProducto).not.toHaveBeenCalled();
    });
});
