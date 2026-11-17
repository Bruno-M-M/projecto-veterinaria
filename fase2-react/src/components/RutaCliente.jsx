import RutaRol from "./RutaRol.jsx";
import { ROL_ADMIN, ROL_CLIENTE } from "../api/session.js";

export default function RutaCliente({ children }) {
    return <RutaRol roles={[ROL_ADMIN, ROL_CLIENTE]}>{children}</RutaRol>;
}