import RutaRol from "./RutaRol.jsx";
import { ROL_ADMIN } from "../api/session.js";

export default function RutaAdmin({ children }) {
    return <RutaRol roles={[ROL_ADMIN]}>{children}</RutaRol>;
}