import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Container, Card, Badge, Table, Alert } from "react-bootstrap";
import { obtenerBoleta } from "../api/boletas.js";
import { mensajeDeError } from "../api/errores.js";
import { formatoPrecio } from "../utils/productos.js";

export default function BoletaDetalle() {
    const { id } = useParams();
    const location = useLocation();
    const [boleta, setBoleta] = useState(location.state?.boleta ?? null);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(!boleta);

    useEffect(() => {
        if (boleta) return;

        obtenerBoleta(id)
            .then(setBoleta)
            .catch((e) => setError(mensajeDeError(e)))
            .finally(() => setCargando(false));
    }, [id, boleta]);

    if (cargando) {
        return <Container className="py-4"><p>Cargando boleta...</p></Container>;
    }

    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">{error}</Alert>
                <Link to="/">Volver al inicio</Link>
            </Container>
        );
    }

    if (!boleta) return null;

    const pagada = boleta.estado === "PAGADA";

    return (
        <Container as="section" className="py-4">
            <Alert variant={pagada ? "success" : "secondary"}>
                {pagada ? "Boleta pagada." : "Esta boleta fue anulada."}
            </Alert>

            <Card className="p-4">
                <h1 className="h3">Boleta N.º {boleta.id}</h1>
                <p className="text-muted mb-1">
                    Fecha: {new Date(boleta.fecha).toLocaleString("es-CL")}
                </p>
                <p>
                    Estado: <Badge bg={pagada ? "success" : "secondary"}>{boleta.estado}</Badge>
                </p>

                <Table responsive className="mt-3">
                    <thead>
                        <tr>
                            <th>Producto (id)</th>
                            <th>Cantidad</th>
                            <th>Precio unitario</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(boleta.detalles ?? []).map((d) => (
                            <tr key={d.id}>
                                <td>{d.productoId}</td>
                                <td>{d.cantidad}</td>
                                <td>{formatoPrecio(d.precioUnitario)}</td>
                                <td>{formatoPrecio(d.subtotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                <h2 className="h4 text-end">Total: {formatoPrecio(boleta.total)}</h2>
            </Card>
        </Container>
    );
}