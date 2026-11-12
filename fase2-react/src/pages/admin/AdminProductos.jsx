import { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Table, Button, Badge, Alert } from "react-bootstrap";
import { useProductos } from "../../context/ProductosContext.jsx";
import { nombreCategoria } from "../../data/categorias.js";
import { esStockCritico, formatoPrecio, mensajeDeError } from "../../utils/productos.js";

function AdminProductos() {
    const { productos, cargando, error, eliminarProducto } = useProductos();
    const [errorEliminar, setErrorEliminar] = useState("");

    async function confirmarEliminar(producto) {
        if (!window.confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        setErrorEliminar("");
        try {
            await eliminarProducto(producto.id);
        } catch (e) {
            setErrorEliminar(mensajeDeError(e));
        }
    }

    return (
        <Container as="section" className="py-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <h1 className="h2 mb-0">Administrar productos</h1>
                <Button as={Link} to="/admin/productos/nuevo" variant="success">+ Nuevo producto</Button>
            </div>

            {errorEliminar && (
                <Alert variant="danger" dismissible onClose={() => setErrorEliminar("")}>
                    {errorEliminar}
                </Alert>
            )}

            {cargando ? (
                <p className="text-muted">Cargando productos...</p>
            ) : error ? (
                <p className="text-muted">{error}</p>
            ) : productos.length === 0 ? (
                <p className="text-muted">No hay productos registrados.</p>
            ) : (
                <Table responsive striped className="align-middle">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th><span className="visually-hidden">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map((producto) => (
                            <tr key={producto.codigo}>
                                <td>{producto.codigo}</td>
                                <td>{producto.nombre}</td>
                                <td>{nombreCategoria(producto.categoria)}</td>
                                <td>{formatoPrecio(producto.precio)}</td>
                                <td>
                                    {producto.stock}
                                    {esStockCritico(producto) && (
                                        <Badge bg="danger" className="ms-2">Stock crítico</Badge>
                                    )}
                                </td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <Button
                                            as={Link}
                                            to={`/admin/productos/${producto.codigo}/editar`}
                                            size="sm"
                                            variant="outline-primary"
                                            aria-label={`Editar ${producto.nombre}`}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            aria-label={`Eliminar ${producto.nombre}`}
                                            onClick={() => confirmarEliminar(producto)}
                                        >
                                            Eliminar
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
}

export default AdminProductos;