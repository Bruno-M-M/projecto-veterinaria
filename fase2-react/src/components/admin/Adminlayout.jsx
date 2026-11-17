import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

function AdminLayout() {
    const [menuAbierto, setMenuAbierto] = useState(false);

    const cerrarMenu = () => setMenuAbierto(false);

    const claseLink = ({ isActive }) =>
        `nav-link text-white ${isActive ? "fw-bold bg-secondary rounded" : ""}`;

    return (
        <div className="admin-layout">
            <header className="admin-topbar bg-dark d-flex d-lg-none align-items-center justify-content-between px-3 py-2">
                <h5 className="text-white mb-0">
                    <i className="bi bi-gear-fill me-2"></i>Panel Admin
                </h5>
                <button
                    type="button"
                    className="btn btn-outline-light btn-sm"
                    aria-label="Abrir o cerrar menú"
                    aria-expanded={menuAbierto}
                    aria-controls="admin-menu"
                    onClick={() => setMenuAbierto((abierto) => !abierto)}
                >
                    <i className={`bi ${menuAbierto ? "bi-x-lg" : "bi-list"}`}></i>
                </button>
            </header>

            <aside
                id="admin-menu"
                className={`admin-sidebar bg-dark p-3 ${menuAbierto ? "abierto" : ""}`}
            >
                <h5 className="text-white mb-4 d-none d-lg-block">
                    <i className="bi bi-gear-fill me-2"></i>Panel Admin
                </h5>

                <nav className="nav flex-column gap-1">
                    <NavLink to="/admin" end className={claseLink} onClick={cerrarMenu}>
                        <i className="bi bi-speedometer2 me-2"></i>Dashboard
                    </NavLink>
                    <NavLink to="/admin/comentarios" className={claseLink} onClick={cerrarMenu}>
                        <i className="bi bi-chat-left-text me-2"></i>Comentarios
                    </NavLink>

                    <NavLink to="/admin/productos" className={claseLink} onClick={cerrarMenu}>
                        <i className="bi bi-box-seam me-2"></i>Productos
                    </NavLink>
                    <NavLink to="/admin/usuarios" className={claseLink} onClick={cerrarMenu}>
                        <i className="bi bi-people me-2"></i>Usuarios
                    </NavLink>
                    <NavLink to="/admin/ordenes" className={claseLink} onClick={cerrarMenu}>
                        <i className="bi bi-receipt me-2"></i>Órdenes
                    </NavLink>

                    <hr className="text-secondary" />

                    <NavLink to="/" className="nav-link text-white" onClick={cerrarMenu}>
                        <i className="bi bi-house-door me-2"></i>Ver Home
                    </NavLink>
                </nav>
            </aside>

            <main className="admin-content bg-light p-3 p-md-4">
                <Outlet />
            </main>
        </div>
    );
}

export default AdminLayout;
