import { Link, useNavigate, useParams } from "react-router-dom";
import { Container } from "react-bootstrap";
import FormularioProducto from "../../components/admin/FormularioProducto.jsx";
import { useProductos } from "../../context/ProductosContext.jsx";
import { aFormulario } from "../../utils/productos.js";

function EditarProducto() {
    const { codigo } = useParams();
    const { productos, cargando, error, editarProducto } = useProductos();
    const navigate = useNavigate();
    const producto = productos.find((p) => p.codigo === codigo);

    async function guardar(datos) {
        await editarProducto(producto.id, datos);
        navigate("/admin/productos");
    }

    return (
        <Container as="section" className="py-4" style={{ maxWidth: 640 }}>
            <h1 className="h2 mb-4">Editar producto</h1>

            {cargando ? (
                <p>Cargando producto...</p>
            ) : error ? (
                <p>{error}</p>
            ) : !producto ? (
                <div className="aviso-no-encontrado">
                    <p>No existe un producto con el código {codigo}.</p>
                    <Link to="/admin/productos">Volver a la lista</Link>
                </div>
            ) : (
                <FormularioProducto
                    key={producto.id}
                    valoresIniciales={aFormulario(producto)}
                    etiquetaBoton="Guardar cambios"
                    productosExistentes={productos.filter((p) => p.id !== producto.id)}
                    alEnviar={guardar}
                />
            )}
        </Container>
    );
}

export default EditarProducto;