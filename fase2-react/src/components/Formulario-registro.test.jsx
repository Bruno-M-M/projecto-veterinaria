import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import FormularioRegistro from './Formulario-registro';
import { registrarUsuario } from '../api/auth.js';

vi.mock('../api/auth.js', () => ({ registrarUsuario: vi.fn() }));

const VALIDOS = {
  nombres: 'Juan Andrés',
  apellidos: 'Pérez Soto',
  run: '111111111', // RUN válido (dígito verificador 1)
  correo: 'juan@duoc.cl',
  correoConfirmar: 'juan@duoc.cl',
  region: 'Valparaíso',
  comuna: 'Viña del Mar',
  password: 'clave1234',
  passwordConfirmar: 'clave1234',
};

// Llena el formulario con datos válidos; "cambios" pisa los campos que cada prueba quiere probar
async function llenarYEnviar(user, cambios = {}) {
  const d = { ...VALIDOS, ...cambios };
  await user.type(screen.getByLabelText(/^nombres$/i), d.nombres);
  await user.type(screen.getByLabelText(/^apellidos$/i), d.apellidos);
  await user.type(screen.getByLabelText(/run/i), d.run);
  await user.type(screen.getByLabelText(/^correo electrónico$/i), d.correo);
  await user.type(screen.getByLabelText(/confirmar correo electrónico/i), d.correoConfirmar);
  await user.selectOptions(screen.getByLabelText(/región/i), d.region);
  await user.selectOptions(screen.getByLabelText(/comuna/i), d.comuna);
  await user.type(screen.getByLabelText(/^contraseña$/i), d.password);
  await user.type(screen.getByLabelText(/confirmar contraseña/i), d.passwordConfirmar);
  await user.click(screen.getByRole('button', { name: /registrar/i }));
}

describe('FormularioRegistro Component', () => {
  beforeEach(() => registrarUsuario.mockReset());

  it('renderiza correctamente todos los campos e interfaz del formulario', () => {
    render(<FormularioRegistro />);

    expect(screen.getByRole('heading', { name: /registro de usuario/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^nombres$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^apellidos$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/run/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^correo electrónico$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/región/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/comuna/i)).toBeDisabled();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar/i })).toBeInTheDocument();
  });

  it('habilita y carga las comunas al seleccionar una región', async () => {
    const user = userEvent.setup();
    render(<FormularioRegistro />);

    const regionSelect = screen.getByLabelText(/región/i);
    const comunaSelect = screen.getByLabelText(/comuna/i);

    expect(comunaSelect).toBeDisabled();

    await user.selectOptions(regionSelect, 'Valparaíso');

    expect(comunaSelect).not.toBeDisabled();
    expect(screen.getByRole('option', { name: 'Viña del Mar' })).toBeInTheDocument();
  });

  it('muestra un error al enviar el formulario con campos vacíos', async () => {
    const user = userEvent.setup();
    render(<FormularioRegistro />);

    await user.click(screen.getByRole('button', { name: /registrar/i }));

    expect(screen.getByText('Debe completar todos los campos.')).toBeInTheDocument();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it('muestra un error si el RUN ingresado es inválido según Módulo 11', async () => {
    const user = userEvent.setup();
    render(<FormularioRegistro />);

    await llenarYEnviar(user, { run: '12345678K' }); // dígito verificador incorrecto

    expect(screen.getByText(/el run ingresado no es válido/i)).toBeInTheDocument();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it('muestra un error si los nombres contienen números o símbolos', async () => {
    const user = userEvent.setup();
    render(<FormularioRegistro />);

    await llenarYEnviar(user, { nombres: 'Juan123' });

    expect(screen.getByText(/el nombre solo debe contener caracteres alfabéticos y espacios/i)).toBeInTheDocument();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it('muestra un error si el dominio del correo no es permitido', async () => {
    const user = userEvent.setup();
    render(<FormularioRegistro />);

    await llenarYEnviar(user, { correo: 'juan@hotmail.com', correoConfirmar: 'juan@hotmail.com' });

    expect(screen.getByText(/el correo debe pertenecer a uno de los dominios permitidos/i)).toBeInTheDocument();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it('muestra un error si los correos electrónicos no coinciden', async () => {
    const user = userEvent.setup();
    render(<FormularioRegistro />);

    await llenarYEnviar(user, { correoConfirmar: 'otro@duoc.cl' });

    expect(screen.getByText(/los correos electrónicos no coinciden/i)).toBeInTheDocument();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it('muestra un error si la contraseña tiene menos de 8 caracteres', async () => {
    const user = userEvent.setup();
    render(<FormularioRegistro />);

    await llenarYEnviar(user, { password: '123456', passwordConfirmar: '123456' });

    expect(screen.getByText(/la contraseña debe tener entre 8 y 72 caracteres/i)).toBeInTheDocument();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it('muestra un error si las contraseñas no coinciden', async () => {
    const user = userEvent.setup();
    render(<FormularioRegistro />);

    await llenarYEnviar(user, { passwordConfirmar: 'otraclave99' });

    expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    expect(registrarUsuario).not.toHaveBeenCalled();
  });

  it('envía el registro a la API y muestra la alerta de registro exitoso', async () => {
    registrarUsuario.mockResolvedValue({ id: 1 });
    const user = userEvent.setup();
    render(<FormularioRegistro />);

    await llenarYEnviar(user);

    expect(await screen.findByText(/¡registro exitoso!/i)).toBeInTheDocument();
    expect(registrarUsuario).toHaveBeenCalledWith({
      run: '111111111',
      nombres: 'Juan Andrés',
      apellidos: 'Pérez Soto',
      correo: 'juan@duoc.cl',
      clave: 'clave1234',
      region: 'Valparaíso',
      comuna: 'Viña del Mar',
    });
  });
});