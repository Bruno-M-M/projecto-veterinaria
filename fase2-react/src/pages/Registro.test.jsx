import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import Registro from './Registro';

describe('Registro Page Component', () => {
  it('renderiza la estructura principal y contenedor de la página', () => {
    render(<Registro />);

    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('flex-grow-1');
  });

  it('renderiza correctamente el formulario de registro embebido', () => {
    render(<Registro />);

    expect(screen.getByRole('heading', { name: /registro de usuario/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^nombres$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^apellidos$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/run/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^correo electrónico$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar/i })).toBeInTheDocument();
  });

  it('permite la interacción y validación del formulario integrado', async () => {
    const user = userEvent.setup();
    render(<Registro />);

    // Envío del formulario vacío para verificar que las reglas de validación funcionan en la vista
    await user.click(screen.getByRole('button', { name: /registrar/i }));

    expect(screen.getByText('Debe completar todos los campos.')).toBeInTheDocument();
  });
});