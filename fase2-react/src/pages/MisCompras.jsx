import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Table, Badge, Alert } from "react-bootstrap";
import { misCompras } from "../api/boletas.js";
import { mensajeDeError } from "../api/errores.js";
import { formatoPrecio } from "../utils/productos.js";

export default function MisCompras() {
    const [compras, setCompras] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        misCompras()
            .then(setCompras)
            .catch((e) => setError(mensajeDeError(e)))
            .finally(() => setCargando(false));
    }, []);

    if (cargando) {
        return <Container className="py-4"><p>Cargando tus compras...</p></Container>;
    }

    if (error) {
        return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;
    }

    return (
        <Container as="section" className="py-4">
            <h1 className="h2 mb-4">Mis compras</h1>

            {compras.length === 0 ? (
                <p className="text-muted">Todavía no tienes compras.</p>
            ) : (
                <Table responsive striped>
                    <thead>
                        <tr>
                            <th>N.º</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th><span className="visually-hidden">Detalle</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {compras.map((c) => (
                            <tr key={c.id}>
                                <td>{c.id}</td>
                                <td>{new Date(c.fecha).toLocaleString("es-CL")}</td>
                                <td>{formatoPrecio(c.total)}</td>
                                <td>
                                    <Badge bg={c.estado === "PAGADA" ? "success" : "secondary"}>
                                        {c.estado}
                                    </Badge>
                                </td>
                                <td>
                                    {/* El detalle por id lo ven solo administrador y vendedor; el cliente ve
                                        aquí el resumen de cada compra, que ya trae el total y el estado. */}
                                    <Link to={`/checkout/boleta/${c.id}`} state={{ boleta: c }}>
                                        Ver boleta
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
}