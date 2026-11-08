import { Link, useNavigate } from "react-router-dom";
import { Container, Table, Button } from "react-bootstrap";
import { useCarrito } from "../context/CarritoContext.jsx";
import { formatoPrecio } from "../utils/productos.js";

function Carrito() {
    const { carrito, cambiarCantidad, quitarDelCarrito, vaciarCarrito, total, cantidadTotal } = useCarrito();
    const navigate = useNavigate();

    if (carrito.length === 0) {
        return (
            <Container className="py-5" id="carrito-vacio">
                <h1 className="h2">Carrito de compras</h1>
                <p className="text-muted">Tu carrito está vacío.</p>
                <Button as={Link} to="/productos" variant="success">Ver productos</Button>
            </Container>
        );
    }

    return (
        <Container as="section" className="py-4">
            <h1 className="h2 mb-4">Carrito de compras</h1>

            <Table responsive className="align-middle">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Cantidad</th>
                        <th>Subtotal</th>
                        <th><span className="visually-hidden">Acciones</span></th>
                    </tr>
                </thead>
                <tbody>
                    {carrito.map((item) => (
                        <tr key={item.producto}>
                            <td>{item.nombre}</td>
                            <td>{formatoPrecio(item.precio)}</td>
                            <td>
                                <div className="cantidad-control">
                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        aria-label={`Disminuir cantidad de ${item.nombre}`}
                                        onClick={() => cambiarCantidad(item.producto, -1)}
                                    >
                                        -
                                    </Button>
                                    <span className="carrito-cantidad">{item.cantidad}</span>
                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        aria-label={`Aumentar cantidad de ${item.nombre}`}
                                        disabled={item.cantidad >= item.stock}
                                        onClick={() => cambiarCantidad(item.producto, 1)}
                                    >
                                        +
                                    </Button>
                                </div>
                                {item.cantidad >= item.stock && (
                                    <small className="text-muted d-block">Máximo disponible: {item.stock}</small>
                                )}
                            </td>
                            <td>{formatoPrecio(item.precio * item.cantidad)}</td>
                            <td>
                                <Button size="sm" variant="outline-danger" onClick={() => quitarDelCarrito(item.producto)}>
                                    Eliminar
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <Button variant="outline-secondary" onClick={vaciarCarrito}>Limpiar carrito</Button>
                <div className="text-center">
                    <p className="mb-0 text-muted" data-testid="cantidad-carrito">Cantidad de productos: {cantidadTotal}</p>
                    <h2 className="h4 mb-0" data-testid="total-carrito">Total: {formatoPrecio(total)}</h2>
                </div>
                <Button variant="success" onClick={() => navigate("/checkout")}>Comprar ahora</Button>
            </div>
        </Container>
    );
}

export default Carrito;
