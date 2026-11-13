import { describe, test, expect } from "vitest";
import { validarProducto } from "./validarProducto.js";

const VALIDO = {
    codigo: "ZZ999",
    nombre: "Producto de prueba",
    descripcion: "Una descripción corta",
    precio: "12000",
    stock: "5",
    stockCritico: "2",
    categoria: "vacunas",
};

const EXISTENTES = [{ codigo: "ME001" }, { codigo: "ME002" }];

const con = (cambios) => ({ ...VALIDO, ...cambios });

describe("validarProducto", () => {
    test("un producto con todos los datos correctos no tiene errores", () => {
        expect(validarProducto(VALIDO, EXISTENTES)).toEqual({});
    });

    test("con todos los campos vacíos marca los siete obligatorios", () => {
        const vacio = { codigo: "", nombre: "", descripcion: "", precio: "", stock: "", stockCritico: "", categoria: "" };
        expect(Object.keys(validarProducto(vacio, EXISTENTES)).sort())
            .toEqual(["categoria", "codigo", "descripcion", "nombre", "precio", "stock", "stockCritico"]);
    });

    describe("código", () => {
        test("rechaza un código de menos de 3 caracteres", () => {
            expect(validarProducto(con({ codigo: "ab" }), EXISTENTES).codigo).toContain("al menos 3");
        });

        test("rechaza un código de más de 5 caracteres", () => {
            expect(validarProducto(con({ codigo: "ABCDEF" }), EXISTENTES).codigo).toContain("5 caracteres");
        });

        test("acepta un código de exactamente 5 caracteres", () => {
            expect(validarProducto(con({ codigo: "ABCDE" }), EXISTENTES).codigo).toBeUndefined();
        });

        test("rechaza un código que ya existe", () => {
            expect(validarProducto(con({ codigo: "ME001" }), EXISTENTES).codigo).toBe("Ya existe un producto con ese código.");
        });

        test("rechaza un código repetido aunque cambien mayúsculas y espacios", () => {
            expect(validarProducto(con({ codigo: " me001 " }), EXISTENTES).codigo).toBe("Ya existe un producto con ese código.");
        });
    });

    describe("nombre y descripción", () => {
        test("rechaza un nombre de más de 60 caracteres", () => {
            expect(validarProducto(con({ nombre: "a".repeat(61) }), EXISTENTES).nombre).toContain("60");
        });

        test("acepta un nombre de exactamente 60 caracteres", () => {
            expect(validarProducto(con({ nombre: "a".repeat(60) }), EXISTENTES).nombre).toBeUndefined();
        });

        test("rechaza una descripción de más de 300 caracteres", () => {
            expect(validarProducto(con({ descripcion: "a".repeat(301) }), EXISTENTES).descripcion).toContain("300");
        });

        test("acepta una descripción de exactamente 300 caracteres", () => {
            expect(validarProducto(con({ descripcion: "a".repeat(300) }), EXISTENTES).descripcion).toBeUndefined();
        });

        test("rechaza una descripción vacía", () => {
            expect(validarProducto(con({ descripcion: "" }), EXISTENTES).descripcion).toBe("La descripción es requerida.");
        });
    });

    describe("precio", () => {
        test("rechaza un precio negativo", () => {
            expect(validarProducto(con({ precio: "-1" }), EXISTENTES).precio).toBe("El precio no puede ser negativo.");
        });

        test("rechaza un precio que no es número", () => {
            expect(validarProducto(con({ precio: "abc" }), EXISTENTES).precio).toContain("debe ser un número");
        });

        test("acepta el precio 0", () => {
            expect(validarProducto(con({ precio: "0" }), EXISTENTES).precio).toBeUndefined();
        });
    });

    describe("stock", () => {
        test("rechaza un stock con decimales", () => {
            expect(validarProducto(con({ stock: "2.5" }), EXISTENTES).stock).toContain("entero");
        });

        test("rechaza un stock negativo", () => {
            expect(validarProducto(con({ stock: "-3" }), EXISTENTES).stock).toContain("entero");
        });

        test("rechaza un stock crítico vacío", () => {
            expect(validarProducto(con({ stockCritico: "" }), EXISTENTES).stockCritico).toBe("El stock crítico es requerido.");
        });

        test("rechaza un stock crítico inválido", () => {
            expect(validarProducto(con({ stockCritico: "-1" }), EXISTENTES).stockCritico).toContain("entero");
        });
    });

    describe("categoría", () => {
        test("rechaza una categoría que no está en la lista", () => {
            expect(validarProducto(con({ categoria: "juguetes" }), EXISTENTES).categoria).toBe("Debe seleccionar una categoría.");
        });
    });

    test("si faltan campos en los datos no falla: los marca como obligatorios", () => {
        expect(Object.keys(validarProducto({})).sort())
            .toEqual(["categoria", "codigo", "descripcion", "nombre", "precio", "stock", "stockCritico"]);
    });

    test("sin lista de productos existentes solo valida el formato del código", () => {
        expect(validarProducto(VALIDO)).toEqual({});
    });
});
