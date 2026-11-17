import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { iniciarSesion } from "../api/auth.js";
import { mensajeDeError } from "../api/errores.js";
import { rutaInicialDe } from "../api/session.js";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setCargando(true);
        try {
            const usuario = await iniciarSesion(email.trim().toLowerCase(), password);
            navigate(rutaInicialDe(usuario.rol));
        } catch (err) {
            setError(
                err.response?.status === 401
                    ? err.response.data?.mensaje ?? "Correo o contraseña incorrectos."
                    : mensajeDeError(err)
            );
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <div className="card shadow-sm p-4">
                        <h2 className="text-center mb-3">Iniciar Sesión</h2>
                        {error && <div className="alert alert-danger">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Correo electrónico</label>
                                <input type="email" className="form-control" value={email}
                                       onChange={(e) => setEmail(e.target.value)}
                                       placeholder="ejemplo@correo.com" required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Contraseña</label>
                                <input type="password" className="form-control" value={password}
                                       onChange={(e) => setPassword(e.target.value)}
                                       placeholder="••••••••" required />
                            </div>
                            <button type="submit" className="btn btn-primary w-100" disabled={cargando}>
                                {cargando ? "Ingresando..." : "Iniciar Sesión"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}