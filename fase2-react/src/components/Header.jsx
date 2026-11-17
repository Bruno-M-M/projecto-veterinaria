import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Badge } from "react-bootstrap";
import { useCarrito } from "../context/CarritoContext.jsx";
import { cerrarSesion } from "../api/auth.js";
import { haySesion, leerUsuario, ROL_ADMIN, ROL_VENDEDOR } from "../api/session.js";

function Header() {
    const { cantidadTotal } = useCarrito();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const navigate = useNavigate();
    useLocation(); // vuelve a leer la sesión en cada navegación (login/logout)
    const usuario = haySesion() ? leerUsuario() : null;
    const esVendedor = usuario?.rol === ROL_VENDEDOR;

    const salir = () => {
        cerrarSesion();
        navigate("/login");
    };

    return (
        <header className="site-header">
            <div className="top-bar">
                <button
                    className="menu-toggle"
                    aria-label="Abrir menú"
                    aria-expanded={menuAbierto}
                    onClick={() => setMenuAbierto(!menuAbierto)}
                >
                    ☰
                </button>
                <nav className={menuAbierto ? "main-nav active" : "main-nav"}>
                    <div className="logo">
                        <img src="/logo.jpg" alt="Logo Veterinaria San Marcos" />
                        <span>Veterinaria San Marcos</span>
                    </div>
                    <ul onClick={() => setMenuAbierto(false)}>
                        {esVendedor ? (
                            <>
                                <li><NavLink to="/vendedor/productos">Productos</NavLink></li>
                                <li><NavLink to="/vendedor/ordenes">Órdenes</NavLink></li>
                            </>
                        ) : (
                            <>
                                <li><NavLink to="/">Home</NavLink></li>
                                <li><NavLink to="/productos">Productos</NavLink></li>
                                <li><NavLink to="/servicios">Servicios</NavLink></li>
                                <li><NavLink to="/nosotros">Nosotros</NavLink></li>
                                <li><NavLink to="/blogs">Blogs</NavLink></li>
                                <li><NavLink to="/contacto">Contacto</NavLink></li>
                                <li>
                                    <NavLink to="/carrito">
                                        Carrito
                                        {cantidadTotal > 0 && (
                                            <Badge pill bg="light" text="dark" className="ms-1">{cantidadTotal}</Badge>
                                        )}
                                    </NavLink>
                                </li>
                            </>
                        )}

                        {usuario ? (
                            <>
                                {usuario.rol === ROL_ADMIN && (
                                    <li><NavLink to="/admin">Panel admin</NavLink></li>
                                )}
                                <li><span className="nav-usuario">Hola, {usuario.nombres}</span></li>
                                <li>
                                    <button type="button" className="btn btn-link nav-registro" onClick={salir}>
                                        Cerrar sesión
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li><NavLink to="/login">Iniciar sesión</NavLink></li>
                                <li><NavLink to="/registro" className="nav-registro">Registrarse</NavLink></li>
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    );
}

export default Header;