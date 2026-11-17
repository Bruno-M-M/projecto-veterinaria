import { Link, useParams } from "react-router-dom";
import { Container, Card, Badge, Button } from "react-bootstrap";
import { useProductos } from "../../context/ProductosContext.jsx";
import { nombreCategoria } from "../../data/categorias.js";
import { esStockCritico, formatoPrecio } from "../../utils/productos.js";

function VendedorProductoDetalle() {
    const { codigo } = useParams();
    const { productos, cargando, error } = useProductos();

    if (cargando) {
        return <Container className="py-4"><p className="text-muted">Cargando producto...</p></Container>;
    }
    if (error) {
        return <Container className="py-4"><p className="text-muted">{error}</p></Container>;
    }

    const producto = productos.find((p) => p.codigo === codigo);

    if (!producto) {
        return (
            <Container className="py-4">
                <p>No se encontró el producto {codigo}.</p>
                <Button as={Link} to="/vendedor/productos" variant="outline-secondary">Volver a productos</Button>
            </Container>
        );
    }

    return (
        <Container as="section" className="py-4">
            <Button as={Link} to="/vendedor/productos" variant="outline-secondary" size="sm" className="mb-3">
                Volver a productos
            </Button>
            <Card className="p-4">
                <h1 className="h3">{producto.nombre}</h1>
                <p className="text-muted mb-2">Código {producto.codigo}</p>
                <p>{producto.descripcion}</p>
                <dl className="row mb-0">
                    <dt className="col-sm-3">Categoría</dt>
                    <dd className="col-sm-9">{nombreCategoria(producto.categoria)}</dd>
                    <dt className="col-sm-3">Precio</dt>
                    <dd className="col-sm-9">{formatoPrecio(producto.precio)}</dd>
                    <dt className="col-sm-3">Stock</dt>
                    <dd className="col-sm-9">
                        {producto.stock}
                        {esStockCritico(producto) && <Badge bg="danger" className="ms-2">Stock crítico</Badge>}
                    </dd>
                    <dt className="col-sm-3">Estado</dt>
                    <dd className="col-sm-9">{producto.activo ? "Activo" : "Desactivado"}</dd>
                </dl>
            </Card>
        </Container>
    );
}

export default VendedorProductoDetalle;