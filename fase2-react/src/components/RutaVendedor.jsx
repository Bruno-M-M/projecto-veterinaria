import RutaRol from "./RutaRol.jsx";
import { ROL_ADMIN, ROL_VENDEDOR } from "../api/session.js";

export default function RutaVendedor({ children }) {
    return <RutaRol roles={[ROL_ADMIN, ROL_VENDEDOR]}>{children}</RutaRol>;
}