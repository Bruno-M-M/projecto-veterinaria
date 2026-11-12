import { describe, test, expect } from "vitest";
import {
    formatoPrecio,
    esStockCritico,
    normalizarTexto,
    aProductoFrontend,
    aSolicitudProducto,
    idDeCategoria,
    mensajeDeError,
    erroresDelServidor,
    aFormulario,
} from "./productos.js";

describe("esStockCritico", () => {
    test("es crítico si el stock es menor o igual al crítico", () => {
        expect(esStockCritico({ stock: 4, stockCritico: 10 })).toBe(true);
    });

    test("no es crítico si el stock supera al crítico", () => {
        expect(esStockCritico({ stock: 45, stockCritico: 10 })).toBe(false);
    });

    test("sin stockCritico usa 5 como límite", () => {
        expect(esStockCritico({ stock: 5 })).toBe(true);
        expect(esStockCritico({ stock: 6 })).toBe(false);
    });

    test("con stock inválido devuelve falso", () => {
        expect(esStockCritico({ stock: "abc", stockCritico: 10 })).toBe(false);
    });
});

describe("formatoPrecio", () => {
    test("agrega el signo peso y el separador de miles", () => {
        expect(formatoPrecio(15000)).toBe("$15.000");
    });

    test("muestra el cero sin separadores", () => {
        expect(formatoPrecio(0)).toBe("$0");
    });

    test("acepta un número escrito como texto", () => {
        expect(formatoPrecio("8400")).toBe("$8.400");
    });
});

describe("normalizarTexto", () => {
    test("pasa a minúsculas y quita las tildes", () => {
        expect(normalizarTexto("Dermatología")).toBe("dermatologia");
        expect(normalizarTexto("Cardíaco")).toBe("cardiaco");
        expect(normalizarTexto("ANTIBIÓTICOS")).toBe("antibioticos");
    });
});

const RESPUESTA_API = {
    id: 16,
    codigo: "ME016",
    nombre: "Vetmedin 2.5mg",
    descripcion: "Pimobendan",
    precio: 28000,
    stock: 15,
    stockCritico: 5,
    activo: true,
    categoriaId: 6,
    categoria: "Cardíaco",
};

describe("aProductoFrontend", () => {
    test("conserva los datos y el id, y convierte la categoría en su identificador", () => {
        expect(aProductoFrontend(RESPUESTA_API)).toEqual({
            id: 16,
            codigo: "ME016",
            nombre: "Vetmedin 2.5mg",
            descripcion: "Pimobendan",
            precio: 28000,
            stock: 15,
            stockCritico: 5,
            activo: true,
            categoria: "cardiaco",
        });
    });
});

describe("aSolicitudProducto", () => {
    const FORMULARIO = {
        codigo: " ZZ999 ",
        nombre: " Producto de prueba ",
        descripcion: " Una descripción ",
        precio: "12000",
        stock: "5",
        stockCritico: "2",
        categoria: "vacunas",
    };

    test("convierte los textos del formulario en el JSON que espera la API", () => {
        expect(aSolicitudProducto(FORMULARIO, 9)).toEqual({
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

    test("conserva el estado activo cuando viene en los datos", () => {
        expect(aSolicitudProducto({ ...FORMULARIO, activo: false }, 9).activo).toBe(false);
    });
});

describe("idDeCategoria", () => {
    const CATEGORIAS = [
        { id: 1, nombre: "Antibióticos" },
        { id: 4, nombre: "Dermatología" },
    ];

    test("encuentra el id a partir del identificador del formulario", () => {
        expect(idDeCategoria(CATEGORIAS, "dermatologia")).toBe(4);
    });

    test("devuelve undefined si la categoría no existe", () => {
        expect(idDeCategoria(CATEGORIAS, "juguetes")).toBeUndefined();
    });

    test("con la lista vacía devuelve undefined", () => {
        expect(idDeCategoria([], "dermatologia")).toBeUndefined();
    });
});

describe("mensajeDeError", () => {
    test("usa el mensaje que manda el servidor", () => {
        const error = { response: { data: { mensaje: "No existe el producto con id 99." } } };
        expect(mensajeDeError(error)).toBe("No existe el producto con id 99.");
    });

    test("si no hubo respuesta avisa que no se pudo conectar", () => {
        expect(mensajeDeError({ request: {} })).toBe("No se pudo conectar con el servidor.");
    });

    test("si la respuesta no trae cuerpo (502 del proxy) también avisa que no se pudo conectar", () => {
        expect(mensajeDeError({ response: { status: 502, data: "" } })).toBe("No se pudo conectar con el servidor.");
    });
});

describe("erroresDelServidor", () => {
    test("un 400 devuelve los mensajes por campo y ningún aviso general", () => {
        const error = { response: { status: 400, data: { mensaje: "Hay datos inválidos.", errores: { nombre: "El nombre es obligatorio." } } } };
        expect(erroresDelServidor(error)).toEqual({ campos: { nombre: "El nombre es obligatorio." }, general: "" });
    });

    test("el error de categoriaId se muestra en el campo categoria", () => {
        const error = { response: { status: 400, data: { errores: { categoriaId: "El producto debe pertenecer a una categoria." } } } };
        expect(erroresDelServidor(error).campos).toEqual({ categoria: "El producto debe pertenecer a una categoria." });
    });

    test("un 409 pone el mensaje del servidor bajo el código", () => {
        const error = { response: { status: 409, data: { mensaje: "Ya existe un producto con el codigo ME001." } } };
        expect(erroresDelServidor(error)).toEqual({ campos: { codigo: "Ya existe un producto con el codigo ME001." }, general: "" });
    });

    test("un error sin campos deja un aviso general con el mensaje del servidor", () => {
        const error = { response: { status: 404, data: { mensaje: "No existe el producto con id 99." } } };
        expect(erroresDelServidor(error)).toEqual({ campos: {}, general: "No existe el producto con id 99." });
    });

    test("sin respuesta deja el aviso de que no se pudo conectar", () => {
        expect(erroresDelServidor({ request: {} })).toEqual({ campos: {}, general: "No se pudo conectar con el servidor." });
    });
});

describe("aFormulario", () => {
    test("convierte el producto en textos para el formulario y conserva activo", () => {
        expect(aFormulario({ ...aProductoFrontend(RESPUESTA_API), activo: false })).toEqual({
            codigo: "ME016",
            nombre: "Vetmedin 2.5mg",
            descripcion: "Pimobendan",
            precio: "28000",
            stock: "15",
            stockCritico: "5",
            categoria: "cardiaco",
            activo: false,
        });
    });

    test("es la inversa de aSolicitudProducto: ida y vuelta no cambia los datos", () => {
        const producto = aProductoFrontend(RESPUESTA_API);
        const solicitud = aSolicitudProducto(aFormulario(producto), RESPUESTA_API.categoriaId);
        expect(solicitud).toEqual({
            codigo: "ME016",
            nombre: "Vetmedin 2.5mg",
            descripcion: "Pimobendan",
            precio: 28000,
            stock: 15,
            stockCritico: 5,
            activo: true,
            categoriaId: 6,
        });
    });
});
