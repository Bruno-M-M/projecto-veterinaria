import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi } from "vitest";
import Login from "./Login.jsx";
import { iniciarSesion } from "../api/auth.js";

vi.mock("../api/auth.js", () => ({ iniciarSesion: vi.fn() }));

function renderLogin() {
  return render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<h1>Panel admin</h1>} />
          <Route path="/vendedor/productos" element={<h1>Vista vendedor</h1>} />
          <Route path="/" element={<h1>Inicio</h1>} />
        </Routes>
      </MemoryRouter>
  );
}

function ingresar(email, clave) {
  fireEvent.change(screen.getByPlaceholderText("ejemplo@correo.com"), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: clave } });
  fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
}

describe("Login", () => {
  beforeEach(() => {
    localStorage.clear();
    iniciarSesion.mockReset();
  });

  it("un administrador entra al panel admin", async () => {
    iniciarSesion.mockResolvedValue({ id: 1, rol: "ADMINISTRADOR" });
    renderLogin();
    ingresar("admin@gmail.com", "clave1234");

    expect(await screen.findByText("Panel admin")).toBeTruthy();
  });

  it("un vendedor va a su vista de productos", async () => {
    iniciarSesion.mockResolvedValue({ id: 2, rol: "VENDEDOR" });
    renderLogin();
    ingresar("vendedor@gmail.com", "clave1234");

    expect(await screen.findByText("Vista vendedor")).toBeTruthy();
  });

  it("un cliente va al inicio", async () => {
    iniciarSesion.mockResolvedValue({ id: 3, rol: "CLIENTE" });
    renderLogin();
    ingresar("cliente@gmail.com", "clave1234");

    expect(await screen.findByText("Inicio")).toBeTruthy();
  });

  it("credenciales incorrectas (401) muestran el mensaje del servidor y no navegan", async () => {
    iniciarSesion.mockRejectedValue({ response: { status: 401, data: { mensaje: "Correo o clave incorrectos" } } });
    renderLogin();
    ingresar("otro@gmail.com", "clave-mala");

    expect(await screen.findByText("Correo o clave incorrectos")).toBeTruthy();
    expect(screen.queryByText("Panel admin")).toBeNull();
  });

  it("si el servidor no responde muestra un error de conexión", async () => {
    iniciarSesion.mockRejectedValue(new Error("Network Error"));
    renderLogin();
    ingresar("otro@gmail.com", "clave1234");

    expect(await screen.findByText("No se pudo conectar con el servidor.")).toBeTruthy();
  });

  it("normaliza el correo a minúsculas antes de enviarlo", async () => {
    iniciarSesion.mockResolvedValue({ id: 1, rol: "ADMINISTRADOR" });
    renderLogin();
    ingresar("ADMIN@GMAIL.COM", "clave1234");

    await screen.findByText("Panel admin");
    expect(iniciarSesion).toHaveBeenCalledWith("admin@gmail.com", "clave1234");
  });
});