import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Table, Badge, Alert, Button } from "react-bootstrap";
import { listarBoletas, anularBoleta } from "../../api/boletas.js";
import { mensajeDeError } from "../../api/errores.js";
import { formatoPrecio } from "../../utils/productos.js";

export default function OrdenesLista({ rutaBase, puedeAnular = false }) {
    const [ordenes, setOrdenes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    async function cargar() {
        try {
            setOrdenes(await listarBoletas());
            setError("");
        } catch (e) {
            setError(mensajeDeError(e));
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargar();
    }, []);

    async function anular(id) {
        if (!window.confirm(`¿Anular la boleta ${id}? Se devolverá el stock.`)) return;
        try {
            await anularBoleta(id);
            await cargar();
        } catch (e) {
            setError(mensajeDeError(e));
        }
    }

    return (
        <Container as="section" className="py-4">
            <h1 className="h2 mb-4">Órdenes</h1>

            {error && <Alert variant="danger">{error}</Alert>}

            {cargando ? (
                <p className="text-muted">Cargando órdenes...</p>
            ) : ordenes.length === 0 ? (
                <p className="text-muted">No hay órdenes registradas.</p>
            ) : (
                <Table responsive striped className="align-middle">
                    <thead>
                        <tr>
                            <th>N.º</th>
                            <th>Fecha</th>
                            <th>Comprador (id)</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th><span className="visually-hidden">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {ordenes.map((o) => (
                            <tr key={o.id}>
                                <td>{o.id}</td>
                                <td>{new Date(o.fecha).toLocaleString("es-CL")}</td>
                                <td>{o.usuarioId}</td>
                                <td>{formatoPrecio(o.total)}</td>
                                <td>
                                    <Badge bg={o.estado === "PAGADA" ? "success" : "secondary"}>
                                        {o.estado}
                                    </Badge>
                                </td>
                                <td className="text-end">
                                    <Button
                                        as={Link}
                                        to={`${rutaBase}/${o.id}`}
                                        size="sm"
                                        variant="outline-primary"
                                        className="me-2"
                                        aria-label={`Ver la orden ${o.id}`}
                                    >
                                        Ver
                                    </Button>
                                    {puedeAnular && o.estado === "PAGADA" && (
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            aria-label={`Anular la orden ${o.id}`}
                                            onClick={() => anular(o.id)}
                                        >
                                            Anular
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
}