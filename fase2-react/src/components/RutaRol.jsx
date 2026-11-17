import { Navigate } from "react-router-dom";
import { haySesion, leerRol } from "../api/session.js";

export default function RutaRol({ roles, children }) {
    if (!haySesion()) return <Navigate to="/login" replace />;
    if (!roles.includes(leerRol())) return <Navigate to="/" replace />;
    return children;
}