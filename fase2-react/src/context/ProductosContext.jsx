import { createContext, useContext, useEffect, useState } from "react";
import { listarProductos } from "../api/productos.js";
import { aProductoFrontend } from "../utils/productos.js";

const ProductosContext = createContext(null);

export function ProductosProvider({ children }) {

    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let activo = true;

        listarProductos()
            .then((datos) => {
                if (activo) setProductos(datos.map(aProductoFrontend));
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

    function agregarProducto(producto) {
        setProductos((actual) => [...actual, producto]);
    }

    function eliminarProducto(codigo) {
        setProductos((actual) => actual.filter((p) => p.codigo !== codigo));
    }

    return (
        <ProductosContext.Provider
            value={{ productos, cargando, error, agregarProducto, eliminarProducto }}
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