import { Navigate, Outlet } from "react-router-dom";
import { haySesion, leerRol, rutaInicialDe, ROL_VENDEDOR } from "../api/session.js";

export default function RutaTienda({ children }) {
    if (haySesion() && leerRol() === ROL_VENDEDOR) {
        return <Navigate to={rutaInicialDe(ROL_VENDEDOR)} replace />;
    }
    return children ?? <Outlet />;
}