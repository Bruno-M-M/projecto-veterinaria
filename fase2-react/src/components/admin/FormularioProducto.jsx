import { useState } from "react";
import { Link } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";
import { CATEGORIAS } from "../../data/categorias.js";
import { validarProducto } from "../../utils/validarProducto.js";
import { erroresDelServidor } from "../../utils/productos.js";

export const FORMULARIO_VACIO = {
    codigo: "",
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    stockCritico: "",
    categoria: "",
};

function FormularioProducto({ valoresIniciales = FORMULARIO_VACIO, etiquetaBoton, productosExistentes, alEnviar }) {
    const [datos, setDatos] = useState(valoresIniciales);
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState("");
    const [enviando, setEnviando] = useState(false);

    function manejarCambio(evento) {
        const { name, value } = evento.target;
        setDatos((actual) => ({ ...actual, [name]: value }));
        setErrores((actual) => ({ ...actual, [name]: undefined }));
    }

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setErrorGeneral("");

        const erroresEncontrados = validarProducto(datos, productosExistentes);
        if (Object.keys(erroresEncontrados).length > 0) {
            setErrores(erroresEncontrados);
            return;
        }

        setEnviando(true);
        try {
            await alEnviar(datos);
        } catch (error) {
            const { campos, general } = erroresDelServidor(error);
            setErrores(campos);
            setErrorGeneral(general);
            setEnviando(false);
        }
    }

    function campo(etiqueta, nombre, props) {
        return (
            <Form.Group className="mb-3" controlId={`campo-${nombre}`}>
                <Form.Label>{etiqueta}</Form.Label>
                <Form.Control
                    name={nombre}
                    value={datos[nombre]}
                    onChange={manejarCambio}
                    isInvalid={Boolean(errores[nombre])}
                    {...props}
                />
                <Form.Control.Feedback type="invalid">{errores[nombre]}</Form.Control.Feedback>
            </Form.Group>
        );
    }

    return (
        <Form noValidate onSubmit={manejarEnvio}>
            {campo("Código", "codigo", { type: "text" })}
            {campo("Nombre", "nombre", { type: "text" })}
            {campo("Descripción", "descripcion", { as: "textarea", rows: 3 })}
            {campo("Precio", "precio", { type: "number", step: 10 })}
            {campo("Stock", "stock", { type: "number", step: 1 })}
            {campo("Stock crítico", "stockCritico", { type: "number", step: 1 })}

            <Form.Group className="mb-4" controlId="campo-categoria">
                <Form.Label>Categoría</Form.Label>
                <Form.Select
                    name="categoria"
                    value={datos.categoria}
                    onChange={manejarCambio}
                    isInvalid={Boolean(errores.categoria)}
                >
                    <option value="">Seleccione una categoría</option>
                    {CATEGORIAS.map((c) => (
                        <option key={c.valor} value={c.valor}>{c.etiqueta}</option>
                    ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errores.categoria}</Form.Control.Feedback>
            </Form.Group>

            {errorGeneral && <Alert variant="danger">{errorGeneral}</Alert>}

            <div className="d-flex justify-content-end gap-2">
                <Button as={Link} to="/admin/productos" variant="outline-secondary">Cancelar</Button>
                <Button type="submit" variant="success" disabled={enviando}>{etiquetaBoton}</Button>
            </div>
        </Form>
    );
}

export default FormularioProducto;