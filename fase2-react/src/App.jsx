import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import AdminLayout from "./components/admin/Adminlayout.jsx";
import RutaAdmin from "./components/RutaAdmin.jsx";
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

// Páginas que aún no se migran
const paginasPendientes = [
    ["servicios", "Servicios"],
    ["checkout", "Checkout"],
];

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="productos" element={<Productos />} />
                    <Route path="producto/:codigo" element={<DetalleProducto />} />
                    <Route path="carrito" element={<Carrito />} />
                    <Route path="nosotros" element={<Nosotros />} />
                    <Route path="blogs" element={<Blogs />} />
                    <Route path="blogs/:id" element={<BlogDetalle />} />
                    <Route path="contacto" element={<Contacto />} />
                    <Route path="login" element={<Login />} />
                    <Route path="registro" element={<Registro />} />

                    {paginasPendientes.map(([ruta, titulo]) => (
                        <Route key={ruta} path={ruta} element={<Pendiente titulo={titulo} />} />
                    ))}
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
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
