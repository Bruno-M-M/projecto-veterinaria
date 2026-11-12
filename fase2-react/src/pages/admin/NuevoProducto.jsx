import { useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import FormularioProducto from "../../components/admin/FormularioProducto.jsx";
import { useProductos } from "../../context/ProductosContext.jsx";

function NuevoProducto() {
    const { productos, agregarProducto } = useProductos();
    const navigate = useNavigate();

    async function crear(datos) {
        await agregarProducto(datos);
        navigate("/admin/productos");
    }

    return (
        <Container as="section" className="py-4" style={{ maxWidth: 640 }}>
            <h1 className="h2 mb-4">Nuevo producto</h1>

            <FormularioProducto
                etiquetaBoton="Crear producto"
                productosExistentes={productos}
                alEnviar={crear}
            />
        </Container>
    );
}

export default NuevoProducto;