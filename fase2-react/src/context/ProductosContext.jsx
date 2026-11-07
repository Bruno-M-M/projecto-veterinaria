import { createContext, useContext, useEffect, useState } from "react";
import {
    listarProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto as eliminarProductoApi,
} from "../api/productos.js";
import { listarCategorias } from "../api/categorias.js";
import { aProductoFrontend, aSolicitudProducto, idDeCategoria } from "../utils/productos.js";

const ProductosContext = createContext(null);

export function ProductosProvider({ children }) {

    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let activo = true;

        Promise.all([listarProductos(), listarCategorias()])
            .then(([datosProductos, datosCategorias]) => {
                if (!activo) return;
                setProductos(datosProductos.map(aProductoFrontend));
                setCategorias(datosCategorias);
            })
            .catch(() => {
                if (activo) setError("No se pudieron cargar los productos. Intenta de nuevo más tarde.");
            })
            .finally(() => {
                if (activo) setCargando(false);
            });

        return () => {
            activo = false;
        };
    }, []);

    async function agregarProducto(datos) {
        const categoriaId = idDeCategoria(categorias, datos.categoria);
        const creado = await crearProducto(aSolicitudProducto(datos, categoriaId));
        setProductos((actual) => [...actual, aProductoFrontend(creado)]);
    }

    async function editarProducto(id, datos) {
        const categoriaId = idDeCategoria(categorias, datos.categoria);
        const editado = await actualizarProducto(id, aSolicitudProducto(datos, categoriaId));
        setProductos((actual) => actual.map((p) => (p.id === id ? aProductoFrontend(editado) : p)));
    }

    async function eliminarProducto(id) {
        await eliminarProductoApi(id);
        setProductos((actual) => actual.filter((p) => p.id !== id));
    }

    return (
        <ProductosContext.Provider
            value={{ productos, categorias, cargando, error, agregarProducto, editarProducto, eliminarProducto }}
        >
            {children}
        </ProductosContext.Provider>
    );
}

export function useProductos() {
    const contexto = useContext(ProductosContext);
    if (!contexto) {
        throw new Error("useProductos debe usarse dentro de <ProductosProvider>");
    }
    return contexto;
}
