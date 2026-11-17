import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import AdminLayout from "./components/admin/Adminlayout.jsx";
import RutaAdmin from "./components/RutaAdmin.jsx";
import RutaVendedor from "./components/RutaVendedor.jsx";
import RutaCliente from "./components/RutaCliente.jsx";
import RutaTienda from "./components/RutaTienda.jsx";
import Home from "./pages/Home.jsx";
import Productos from "./pages/Productos.jsx";
import DetalleProducto from "./pages/DetalleProducto.jsx";
import Carrito from "./pages/Carrito.jsx";
import Nosotros from "./pages/Nosotros.jsx";
import Blogs from "./pages/Blogs.jsx";
import BlogDetalle from "./pages/BlogDetalle.jsx";
import Contacto from "./pages/Contacto.jsx";
import Login from "./pages/Login.jsx";
import Registro from "./pages/Registro.jsx";
import Pendiente from "./pages/Pendiente.jsx";
import NoEncontrado from "./pages/NoEncontrado.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminComentarios from "./pages/admin/AdminComentarios.jsx";
import AdminProductos from "./pages/admin/AdminProductos.jsx";
import NuevoProducto from "./pages/admin/NuevoProducto.jsx";
import EditarProducto from "./pages/admin/EditarProducto.jsx";
import Usuarios from "./pages/admin/Usuarios.jsx";
import Checkout from "./pages/Checkout.jsx";
import BoletaDetalle from "./pages/BoletaDetalle.jsx";
import OrdenesLista from "./pages/ordenes/OrdenesLista.jsx";
import VendedorProductos from "./pages/vendedor/VendedorProductos.jsx";
import VendedorProductoDetalle from "./pages/vendedor/VendedorProductoDetalle.jsx";
import MisCompras from "./pages/MisCompras.jsx";
import RutaRol from "./components/RutaRol.jsx";
import { ROL_CLIENTE } from "./api/session.js";

// Páginas que aún no se migran
const paginasPendientes = [
    ["servicios", "Servicios"],
];

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    {/* Tienda: pública, pero el vendedor es redirigido a su vista */}
                    <Route element={<RutaTienda />}>
                        <Route index element={<Home />} />
                        <Route path="productos" element={<Productos />} />
                        <Route path="producto/:codigo" element={<DetalleProducto />} />
                        <Route path="carrito" element={<Carrito />} />
                        <Route path="nosotros" element={<Nosotros />} />
                        <Route path="blogs" element={<Blogs />} />
                        <Route path="blogs/:id" element={<BlogDetalle />} />
                        <Route path="contacto" element={<Contacto />} />
                        {paginasPendientes.map(([ruta, titulo]) => (
                            <Route key={ruta} path={ruta} element={<Pendiente titulo={titulo} />} />
                        ))}
                        <Route path="checkout" element={ <RutaCliente> <Checkout /> </RutaCliente> } />
                        <Route path="checkout/boleta/:id" element={ <RutaCliente> <BoletaDetalle /> </RutaCliente> } />
                        <Route path="mis-compras" element={ <RutaRol roles={[ROL_CLIENTE]}> <MisCompras /> </RutaRol> } />
                    </Route>

                    <Route path="login" element={<Login />} />
                    <Route path="registro" element={<Registro />} />

                    {/* Vista del vendedor: solo productos y órdenes */}
                    <Route
                        path="vendedor"
                        element={
                            <RutaVendedor>
                                <Outlet />
                            </RutaVendedor>
                        }
                    >
                        {/* Bruno (productos) y Alfonso (órdenes) reemplazan estas páginas */}
                        <Route path="productos" element={<VendedorProductos />} />
                        <Route path="productos/:codigo" element={<VendedorProductoDetalle />} />
                        <Route path="ordenes" element={<OrdenesLista rutaBase="/vendedor/ordenes" />} />
                        <Route path="ordenes/:id" element={<BoletaDetalle />} />
                    </Route>

                    <Route path="*" element={<NoEncontrado />} />
                </Route>

                <Route
                    path="admin"
                    element={
                        <RutaAdmin>
                            <AdminLayout />
                        </RutaAdmin>
                    }
                >
                    <Route index element={<AdminDashboard />} />
                    <Route path="comentarios" element={<AdminComentarios />} />
                    <Route path="productos" element={<AdminProductos />} />
                    <Route path="productos/nuevo" element={<NuevoProducto />} />
                    <Route path="productos/:codigo/editar" element={<EditarProducto />} />
                    <Route path="usuarios" element={<Usuarios />} />
                    <Route path="ordenes" element={<OrdenesLista rutaBase="/admin/ordenes" puedeAnular />} />
                    <Route path="ordenes/:id" element={<BoletaDetalle />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;