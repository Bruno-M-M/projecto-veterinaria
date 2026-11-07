import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import { nombreCategoria } from "../data/categorias.js";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useProductos } from "../context/ProductosContext.jsx";

function ContenidoDetalle({ producto }) {
    const { agregarAlCarrito } = useCarrito();
    const { productos } = useProductos();
    const [cantidad, setCantidad] = useState(1);
    const [agregado, setAgregado] = useState(false);
    const sinStock = producto.stock < 1;

    useEffect(() => {
        document.title = `${producto.nombre} - Veterinaria San Marcos`;
        return () => {
            document.title = "Veterinaria San Marcos";
        };
    }, [producto.nombre]);

    const recomendados = productos
        .filter((p) => p.categoria === producto.categoria && p.codigo !== producto.codigo)
        .slice(0, 3);

    function manejarAgregar() {
        agregarAlCarrito(producto, cantidad);
        setAgregado(true);
        setTimeout(() => setAgregado(false), 1200);
    }

    return (
        <>
            <div
                className="detalle-contenido"
                style={{ "--color-servicio": `var(--color-${producto.categoria})` }}
            >
                <p className="detalle-categoria">{nombreCategoria(producto.categoria)}</p>
                <h2 id="detalle-nombre">{producto.nombre}</h2>
                <p className="detalle-descripcion">{producto.descripcion}</p>
                <p className="detalle-precio">${producto.precio.toLocaleString("es-CL")}</p>

                <div className="detalle-cantidad">
                    <span>Cantidad:</span>
                    <div className="cantidad-control">
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                        >
                            -
                        </Button>
                        <span className="carrito-cantidad">{cantidad}</span>
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            disabled={cantidad >= producto.stock}
                            onClick={() => setCantidad((c) => Math.min(producto.stock, c + 1))}
                        >
                            +
                        </Button>
                    </div>
                </div>

                <Button variant="success" disabled={agregado || sinStock} onClick={manejarAgregar}>
                    {sinStock ? "Sin stock" : agregado ? "Agregado" : "Agregar al carrito"}
                </Button>
            </div>

            {recomendados.length > 0 && (
                <div className="recomendados">
                    <h3>También te puede interesar</h3>
                    <div className="recomendados-grid">
                        {recomendados.map((item) => (
                            <Link
                                key={item.codigo}
                                to={`/producto/${item.codigo}`}
                                className={`recomendado-item ${item.categoria}`}
                            >
                                <span className="recomendado-nombre">{item.nombre}</span>
                                <span className="recomendado-precio">
                                    ${item.precio.toLocaleString("es-CL")}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

function DetalleProducto() {
    const { codigo } = useParams();
    const { productos, cargando, error } = useProductos();
    const producto = productos.find((p) => p.codigo === codigo);

    return (
        <section id="detalle-producto">
            <p className="volver">
                <Link to="/productos">&larr; Volver a productos</Link>
            </p>

            {cargando ? (
                <p className="aviso-no-encontrado">Cargando producto...</p>
            ) : error ? (
                <p className="aviso-no-encontrado">{error}</p>
            ) : producto ? (
                // key={codigo}: al pasar a otro producto desde "Te puede interesar" el estado
                // (cantidad, "Agregado") se reinicia, como pasaba al recargar la pagina en el HTML.
                <ContenidoDetalle key={producto.codigo} producto={producto} />
            ) : (
                <div className="aviso-no-encontrado">
                    <p>No encontramos el producto que buscabas. Puede que el enlace esté roto o incompleto.</p>
                    <Link to="/productos">Ver todos los productos</Link>
                </div>
            )}
        </section>
    );
}

export default DetalleProducto;
