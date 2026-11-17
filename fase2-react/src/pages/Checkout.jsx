import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Card, Button, Alert, Table } from "react-bootstrap";
import { useCarrito } from "../context/CarritoContext.jsx";
import { crearBoleta } from "../api/boletas.js";
import { mensajeDeError } from "../api/errores.js";
import { formatoPrecio } from "../utils/productos.js";

export default function Checkout() {
    const { carrito, vaciarCarrito } = useCarrito();
    const navigate = useNavigate();
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState("");

    const total = carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);

    if (carrito.length === 0) {
        return (
            <Container className="py-4">
                <p>Tu carrito está vacío.</p>
                <Link to="/productos">Ver productos</Link>
            </Container>
        );
    }

    async function confirmar() {
        setError("");
        setEnviando(true);
        try {
            const boleta = await crearBoleta(carrito);
            vaciarCarrito();
            navigate(`/checkout/boleta/${boleta.id}`, { state: { boleta } });
        } catch (e) {
            setError(mensajeDeError(e));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <Container as="section" className="py-4">
            <h1 className="h2 mb-4">Confirmar compra</h1>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="p-4 mb-4">
                <Table responsive>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carrito.map((item) => (
                            <tr key={item.producto}>
                                <td>{item.nombre}</td>
                                <td>{item.cantidad}</td>
                                <td>{formatoPrecio(item.precio)}</td>
                                <td>{formatoPrecio(item.precio * item.cantidad)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <h2 className="h4 text-end" data-testid="total-checkout">
                    Total: {formatoPrecio(total)}
                </h2>
            </Card>

            <div className="d-flex justify-content-end gap-2">
                <Button as={Link} to="/carrito" variant="outline-secondary">
                    Volver al carrito
                </Button>
                <Button variant="success" onClick={confirmar} disabled={enviando}>
                    {enviando ? "Procesando..." : "Confirmar compra"}
                </Button>
            </div>
        </Container>
    );
}