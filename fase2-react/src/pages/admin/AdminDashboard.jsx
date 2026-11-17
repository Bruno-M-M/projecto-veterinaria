import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cerrarSesion as limpiarSesion } from "../../api/auth.js";
import { leerUsuario } from "../../api/session.js";

const CLAVE_STORAGE = "comentarios_san_marcos";

export default function AdminDashboard() {
    const [comentarios, setComentarios] = useState([]);
    const usuario = leerUsuario();

    useEffect(() => {
        try {
            const guardados = localStorage.getItem(CLAVE_STORAGE);
            if (guardados) {
                setComentarios(JSON.parse(guardados));
            }
        } catch (error) {
            console.error("Error al cargar comentarios:", error);
        }
    }, []);

    const cerrarSesion = () => {
        limpiarSesion(); // borra token, refreshToken y usuario
        window.location.href = "/login";
    };

    return (
        <div className="container py-4">
            {/* Encabezado del Dashboard */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <div>
                    <h1 className="h2 mb-1">Panel de Administración</h1>
                    <p className="text-muted mb-0">
                        Bienvenido de vuelta{usuario?.nombres ? `, ${usuario.nombres}` : ""}. Gestiona la información de la veterinaria aquí.
                    </p>
                </div>
                <button onClick={cerrarSesion} className="btn btn-outline-danger">
                    <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                </button>
            </div>

            {/* Tarjetas de Estadísticas / Resumen */}
            <div className="row g-4 mb-5">
                <div className="col-md-4">
                    <div className="card shadow-sm border-0 border-start border-primary border-4 p-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase">
                                    Total Comentarios
                                </span>
                                <h2 className="mb-0 mt-1">{comentarios.length}</h2>
                            </div>
                            <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
                                <i className="bi bi-chat-left-text-fill fs-3"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card shadow-sm border-0 border-start border-success border-4 p-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase">
                                    Estado del Sistema
                                </span>
                                <h2 className="fs-4 mb-0 mt-1 text-success">Activo</h2>
                            </div>
                            <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle">
                                <i className="bi bi-check-circle-fill fs-3"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card shadow-sm border-0 border-start border-info border-4 p-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted small fw-bold text-uppercase">
                                    Rol Actual
                                </span>
                                <h2 className="fs-4 mb-0 mt-1">Administrador</h2>
                            </div>
                            <div className="bg-info bg-opacity-10 text-info p-3 rounded-circle">
                                <i className="bi bi-person-badge-fill fs-3"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accesos Rápidos y Últimos Comentarios */}
            <div className="row g-4">
                {/* Accesos directos */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 p-3 mb-4">
                        <h5 className="mb-3">Gestión Rápida</h5>
                        <div className="d-grid gap-2">
                            <Link to="/admin/comentarios" className="btn btn-primary text-start">
                                <i className="bi bi-chat-dots me-2"></i> Administrar Comentarios
                            </Link>
                            <Link to="/" className="btn btn-outline-secondary text-start" target="_blank">
                                <i className="bi bi-globe me-2"></i> Ver Sitio Público
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Vista previa de últimos comentarios */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 p-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">Últimos Comentarios Recibidos</h5>
                            <Link to="/admin/comentarios" className="btn btn-sm btn-link text-decoration-none">
                                Ver todos ({comentarios.length}) &rarr;
                            </Link>
                        </div>

                        {comentarios.length === 0 ? (
                            <p className="text-muted my-3 text-center">
                                No se han registrado comentarios aún.
                            </p>
                        ) : (
                            <div className="list-group list-group-flush">
                                {comentarios.slice(0, 3).map((item) => (
                                    <div key={item.id} className="list-group-item px-0 py-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <strong>{item.nombre || "Anónimo"}</strong>
                                            <small className="text-muted">{item.fecha}</small>
                                        </div>
                                        <p className="mb-0 text-secondary small">
                                            {item.mensaje || item.comentario || item.texto}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}