import { describe, test, expect, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProductoCard from "./ProductoCard.jsx";

const PRODUCTO = {
    codigo: "ME001",
    nombre: "Amoxibay 250mg",
    descripcion: "Amoxicilina en blíster de 10 comprimidos",
    precio: 15000,
    categoria: "antibioticos",
};

const renderProductoCard = (alAgregar) =>
    render(
        <MemoryRouter>
            <ProductoCard producto={PRODUCTO} alAgregar={alAgregar} />
        </MemoryRouter>
    );

describe("Componente ProductoCard", () => {
    afterEach(() => vi.useRealTimers());

    test("muestra el nombre y la descripción del producto", () => {
        renderProductoCard();
        expect(screen.getByText("Amoxibay 250mg")).toBeInTheDocument();
        expect(screen.getByText("Amoxicilina en blíster de 10 comprimidos")).toBeInTheDocument();
    });

    test("muestra el precio con separador de miles", () => {
        renderProductoCard();
        expect(screen.getByText("$15.000")).toBeInTheDocument();
    });

    test("el nombre enlaza al detalle del producto", () => {
        renderProductoCard();
        expect(screen.getByRole("link", { name: "Amoxibay 250mg" })).toHaveAttribute("href", "/producto/ME001");
    });

    test("al presionar Agregar llama a alAgregar con el producto", async () => {
        const alAgregar = vi.fn();
        renderProductoCard(alAgregar);

        await userEvent.click(screen.getByRole("button", { name: "Agregar" }));

        expect(alAgregar).toHaveBeenCalledTimes(1);
        expect(alAgregar).toHaveBeenCalledWith(PRODUCTO);
    });

    test("después de agregar muestra Agregado y bloquea el botón", async () => {
        renderProductoCard(vi.fn());

        await userEvent.click(screen.getByRole("button", { name: "Agregar" }));

        expect(screen.getByRole("button", { name: "Agregado" })).toBeDisabled();
    });

    test("el botón vuelve a Agregar después de 1200 ms", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderProductoCard(vi.fn());

        await user.click(screen.getByRole("button", { name: "Agregar" }));
        expect(screen.getByRole("button", { name: "Agregado" })).toBeInTheDocument();

        act(() => vi.advanceTimersByTime(1200));

        expect(screen.getByRole("button", { name: "Agregar" })).toBeEnabled();
    });

    test("si no recibe alAgregar el botón igual funciona sin errores", async () => {
        renderProductoCard();

        await userEvent.click(screen.getByRole("button", { name: "Agregar" }));

        expect(screen.getByRole("button", { name: "Agregado" })).toBeInTheDocument();
    });
});
