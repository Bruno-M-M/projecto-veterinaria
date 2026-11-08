import { useState } from "react";
import ProductoCard from "../components/ProductoCard.jsx";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useProductos } from "../context/ProductosContext.jsx";
import { CATEGORIAS } from "../data/categorias.js";

function Productos() {
    const [categoria, setCategoria] = useState("todas");
    const { agregarAlCarrito } = useCarrito();
    const { productosActivos, cargando, error } = useProductos();

    const productosAMostrar =
        categoria === "todas"
        ? productosActivos
        : productosActivos.filter((p) => p.categoria === categoria);

    if (cargando) return <p className="aviso-no-encontrado">Cargando productos...</p>;
    if (error) return <p className="aviso-no-encontrado">{error}</p>;

    return (
        <section id="productos">
            <div className="select-categoria">
                <h2 className="servicios-nombre">Nuestros Productos</h2>

                <select 
                    className="categoria-select"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    >
                        <option value="todas">Todas las categorías</option>
                        {CATEGORIAS.map((c) => (
                            <option key={c.valor} value={c.valor}>
                                {c.etiqueta}
                            </option>
                        ))}
                    </select>
            </div>

            <div className="servicios">
                {productosAMostrar.map((producto) => (
                    <ProductoCard key={producto.codigo} producto={producto}
                    alAgregar={agregarAlCarrito}/>
                ))}
            </div>
        </section>
    )
}

export default Productos;