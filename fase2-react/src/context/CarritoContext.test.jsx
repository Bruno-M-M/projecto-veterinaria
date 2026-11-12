import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CarritoProvider, useCarrito } from "./CarritoContext.jsx";

const PRODUCTO = { codigo: "ME001", nombre: "Amoxibay 250mg", precio: 4200 };
const OTRO = { codigo: "ME002", nombre: "Enrox 50mg", precio: 6800 };

function Sonda() {
    const { carrito, total, cantidadTotal, agregarAlCarrito, cambiarCantidad, quitarDelCarrito, vaciarCarrito } = useCarrito();
    return (
        <div>
            <span data-testid="total">{total}</span>
            <span data-testid="cantidad">{cantidadTotal}</span>
            <span data-testid="lineas">{carrito.length}</span>
            <button onClick={() => agregarAlCarrito(PRODUCTO)}>agregar</button>
            <button onClick={() => cambiarCantidad("ME001", 1)}>sumar</button>
            <button onClick={() => cambiarCantidad("ME001", -1)}>restar</button>
            <button onClick={() => quitarDelCarrito("ME001")}>quitar</button>
            <button onClick={() => agregarAlCarrito(OTRO)}>agregar otro</button>
            <button onClick={() => agregarAlCarrito(PRODUCTO, 3)}>agregar tres</button>
            <button onClick={vaciarCarrito}>vaciar</button>
        </div>
    );
}

const montar = () => render(<CarritoProvider><Sonda /></CarritoProvider>);
const ver = (id) => screen.getByTestId(id).textContent;
const clic = (texto) => userEvent.click(screen.getByText(texto));

describe("CarritoContext", () => {
    beforeEach(() => localStorage.clear());

    test("agregar un producto actualiza líneas, cantidad y total", async () => {
        montar();
        await clic("agregar");
        expect(ver("lineas")).toBe("1");
        expect(ver("total")).toBe("4200");
    });

    test("agregar dos veces el mismo producto suma la cantidad en una sola línea", async () => {
        montar();
        await clic("agregar");
        await clic("agregar");
        expect(ver("lineas")).toBe("1");
        expect(ver("cantidad")).toBe("2");
        expect(ver("total")).toBe("8400");
    });

    test("sumar aumenta la cantidad y el total", async () => {
        montar();
        await clic("agregar");
        await clic("sumar");
        expect(ver("cantidad")).toBe("2");
        expect(ver("total")).toBe("8400");
    });

    test("restar cuando la cantidad es 1 elimina el producto", async () => {
        montar();
        await clic("agregar");
        await clic("restar");
        expect(ver("lineas")).toBe("0");
        expect(ver("total")).toBe("0");
    });

    test("al iniciar recupera el carrito guardado en localStorage", () => {
        localStorage.setItem("carrito", JSON.stringify([
            { producto: "ME001", nombre: "Amoxibay 250mg", precio: 4200, cantidad: 2 },
        ]));
        montar();
        expect(ver("cantidad")).toBe("2");
    });

    test("guarda el carrito en localStorage cada vez que cambia", async () => {
        const espia = vi.spyOn(Storage.prototype, "setItem");
        montar();
        await clic("agregar");
        expect(espia).toHaveBeenCalledWith("carrito", expect.stringMatching("ME001"));
    });

    test("useCarrito fuera del CarritoProvider lanza un error claro", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => render(<Sonda />)).toThrowError(/CarritoProvider/);
    });

    test("quitar elimina solo ese producto", async () => {
        montar();
        await clic("agregar");
        await clic("agregar otro");
        await clic("quitar");
        expect(ver("lineas")).toBe("1");
        expect(ver("total")).toBe("6800");
    });

    test("vaciar deja el carrito sin productos", async () => {
        montar();
        await clic("agregar");
        await clic("agregar otro");
        await clic("vaciar");
        expect(ver("lineas")).toBe("0");
    });

    test("sumar cambia solo la cantidad de su producto", async () => {
        montar();
        await clic("agregar");
        await clic("agregar otro");
        await clic("sumar");
        expect(ver("cantidad")).toBe("3");
        expect(ver("total")).toBe("15200");
    });

    test("agregar con una cantidad distinta de 1", async () => {
        montar();
        await clic("agregar tres");
        expect(ver("cantidad")).toBe("3");
        expect(ver("total")).toBe("12600");
    });

    test("agregar un producto repetido no toca a los demás", async () => {
        montar();
        await clic("agregar");
        await clic("agregar otro");
        await clic("agregar");
        expect(ver("lineas")).toBe("2");
        expect(ver("total")).toBe("15200");
    });

    const BRAVECTO = { id: 5, codigo: "ME005", nombre: "Bravecto", precio: 18900, stock: 4 };
const AGOTADO = { id: 21, codigo: "ME021", nombre: "Omega vet 3-6-9", precio: 9900, stock: 0 };

function SondaStock() {
    const { carrito, agregarAlCarrito, cambiarCantidad } = useCarrito();
    return (
        <div>
            <span data-testid="unidades">{carrito.find((i) => i.producto === "ME005")?.cantidad ?? 0}</span>
            <span data-testid="lineas">{carrito.length}</span>
            <span data-testid="linea">{JSON.stringify(carrito[0] ?? null)}</span>
            <button onClick={() => agregarAlCarrito(BRAVECTO)}>agregar bravecto</button>
            <button onClick={() => agregarAlCarrito(BRAVECTO, 10)}>agregar diez</button>
            <button onClick={() => cambiarCantidad("ME005", 1)}>sumar bravecto</button>
            <button onClick={() => agregarAlCarrito(AGOTADO)}>agregar agotado</button>
        </div>
    );
}

describe("CarritoContext y el stock disponible", () => {
    beforeEach(() => localStorage.clear());
    const montarStock = () => render(<CarritoProvider><SondaStock /></CarritoProvider>);

    test("agregar más unidades que el stock deja solo el stock", async () => {
        montarStock();
        await clic("agregar diez");
        expect(ver("unidades")).toBe("4");
    });

    test("agregar de a una no pasa del stock", async () => {
        montarStock();
        for (let i = 0; i < 6; i++) await clic("agregar bravecto");
        expect(ver("unidades")).toBe("4");
    });

    test("sumar en el carrito no pasa del stock", async () => {
        montarStock();
        await clic("agregar diez");
        await clic("sumar bravecto");
        expect(ver("unidades")).toBe("4");
    });

    test("un producto sin stock no entra al carrito", async () => {
        montarStock();
        await clic("agregar agotado");
        expect(ver("lineas")).toBe("0");
    });

    test("la línea guarda el id del producto y su stock", async () => {
        montarStock();
        await clic("agregar bravecto");
        const linea = JSON.parse(ver("linea"));
        expect(linea.productoId).toBe(5);
        expect(linea.stock).toBe(4);
    });
});
});