import { Link } from "react-router-dom";
import { Container, Table, Button, Badge } from "react-bootstrap";
import { useProductos } from "../../context/ProductosContext.jsx";
import { nombreCategoria } from "../../data/categorias.js";
import { esStockCritico, formatoPrecio } from "../../utils/productos.js";

function VendedorProductos() {
    const { productos, cargando, error } = useProductos();

    return (
        <Container as="section" className="py-4">
            <h1 className="h2 mb-4">Productos</h1>

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
                            <th><span className="visually-hidden">Detalle</span></th>
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
                                    <Button
                                        as={Link}
                                        to={`/vendedor/productos/${producto.codigo}`}
                                        size="sm"
                                        variant="outline-primary"
                                        aria-label={`Ver ${producto.nombre}`}
                                    >
                                        Ver detalle
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
}

export default VendedorProductos;