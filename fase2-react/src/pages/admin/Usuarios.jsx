import { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert, Badge, Row, Col, InputGroup, Card, Spinner } from 'react-bootstrap';
import { listarUsuarios, crearUsuario, editarUsuario, cambiarEstadoUsuario } from '../../api/usuarios.js';

const validarRUN = (run) => {
  const limpio = run.replace(/\./g, '').replace(/-/g, '').trim();
  const regExp = /^[0-9]{7,8}[0-9kK]$/;
  if (!regExp.test(limpio)) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1).toUpperCase();

  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = suma % 11;
  let dvEsperado = 11 - resto;
  if (dvEsperado === 11) dvEsperado = '0';
  else if (dvEsperado === 10) dvEsperado = 'K';
  else dvEsperado = dvEsperado.toString();

  return dv === dvEsperado;
};

const formatearRunBackend = (run) => {
  const limpio = run.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
};

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    run: '',
    correo: '',
    telefono: '',
    rol: 'CLIENTE',
    password: '',
    passwordConfirmar: ''
  });

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setErrorGeneral('');
      const data = await listarUsuarios();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorGeneral(err.response?.data?.mensaje || 'No se pudieron cargar los usuarios desde el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleOpenModal = (usuario = null) => {
    setMensaje({ tipo: '', texto: '' });
    if (usuario) {
      setUsuarioEditar(usuario);
      setFormData({
        nombres: usuario.nombres || '',
        apellidos: usuario.apellidos || '',
        run: (usuario.run || '').replace(/-/g, ''),
        correo: usuario.correo || '',
        telefono: usuario.telefono || '',
        rol: usuario.rol || 'CLIENTE',
        password: '',
        passwordConfirmar: ''
      });
    } else {
      setUsuarioEditar(null);
      setFormData({
        nombres: '',
        apellidos: '',
        run: '',
        correo: '',
        telefono: '',
        rol: 'CLIENTE',
        password: '',
        passwordConfirmar: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setUsuarioEditar(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nombres = formData.nombres.trim();
    const apellidos = formData.apellidos.trim();
    const run = formData.run.trim();
    const correo = formData.correo.trim();
    const telefono = formData.telefono.trim();
    const rol = formData.rol;
    const pwd = formData.password.trim();
    const pwdConf = formData.passwordConfirmar.trim();

    if (!nombres || !apellidos || !run || !correo || !rol) {
      setMensaje({ tipo: 'danger', texto: 'Por favor completa todos los campos requeridos.' });
      return;
    }

    if (!validarRUN(run)) {
      setMensaje({
        tipo: 'danger',
        texto: 'El RUN ingresado no es válido. Ingréselo sin puntos ni guión (ej: 111111111).'
      });
      return;
    }

    const soloLetrasYEspacios = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!soloLetrasYEspacios.test(nombres) || !soloLetrasYEspacios.test(apellidos)) {
      setMensaje({ tipo: 'danger', texto: 'Nombres y apellidos solo deben contener letras y espacios.' });
      return;
    }

    if (!usuarioEditar || pwd.length > 0) {
      if (pwd.length < 8 || pwd.length > 72) {
        setMensaje({ tipo: 'danger', texto: 'La contraseña debe tener entre 8 y 72 caracteres.' });
        return;
      }
      if (pwd !== pwdConf) {
        setMensaje({ tipo: 'danger', texto: 'Las contraseñas no coinciden.' });
        return;
      }
    }

    const payload = {
      run: formatearRunBackend(run),
      nombres,
      apellidos,
      correo,
      telefono: telefono || null,
      region: usuarioEditar?.region || null,
      comuna: usuarioEditar?.comuna || null,
      rol,
      ...(pwd.length > 0 ? { clave: pwd } : {})
    };

    try {
      setGuardando(true);
      if (usuarioEditar) {
        await editarUsuario(usuarioEditar.id, payload);
      } else {
        await crearUsuario(payload);
      }
      await cargarUsuarios();
      handleCloseModal();
    } catch (err) {
      const resp = err.response?.data;
      const detalle = resp?.errores ? Object.values(resp.errores).join('. ') : null;
      setMensaje({
        tipo: 'danger',
        texto: detalle || resp?.mensaje || 'Error al guardar el usuario.'
      });
    } finally {
      setGuardando(false);
    }
  };

  const toggleEstado = async (usuario) => {
    try {
      setErrorGeneral('');
      await cambiarEstadoUsuario(usuario.id, !usuario.activo);
      await cargarUsuarios();
    } catch (err) {
      setErrorGeneral(err.response?.data?.mensaje || 'No se pudo cambiar el estado del usuario.');
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const nombreCompleto = `${u.nombres || ''} ${u.apellidos || ''}`.toLowerCase();
    const termino = busqueda.toLowerCase();
    return (
      nombreCompleto.includes(termino) ||
      (u.run || '').toLowerCase().includes(termino) ||
      (u.correo || '').toLowerCase().includes(termino)
    );
  });

  const badgeRol = (rol) => {
    if (rol === 'ADMINISTRADOR') return 'primary';
    if (rol === 'VENDEDOR') return 'info';
    return 'secondary';
  };

  return (
    <div className="container my-5">
      <Card className="shadow p-4">
        <Row className="mb-4 align-items-center">
          <Col md={6}>
            <h2>Gestión de Usuarios</h2>
          </Col>
          <Col md={6} className="text-md-end mt-3 mt-md-0">
            <Button variant="success" onClick={() => handleOpenModal()}>
              + Nuevo Usuario
            </Button>
          </Col>
        </Row>

        {errorGeneral && <Alert variant="danger">{errorGeneral}</Alert>}

        <Row className="mb-3">
          <Col md={6}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Buscar por nombre, RUN o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </InputGroup>
          </Col>
        </Row>

        {cargando ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover responsive align="middle">
              <thead className="table-dark">
                <tr>
                  <th>Nombre</th>
                  <th>RUN</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((u) => (
                    <tr key={u.id}>
                      <td>{`${u.nombres} ${u.apellidos}`}</td>
                      <td>{u.run}</td>
                      <td>{u.correo}</td>
                      <td>
                        <Badge bg={badgeRol(u.rol)}>{u.rol}</Badge>
                      </td>
                      <td>
                        <Badge bg={u.activo ? 'success' : 'danger'}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleOpenModal(u)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant={u.activo ? 'secondary' : 'info'}
                          size="sm"
                          onClick={() => toggleEstado(u)}
                        >
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      No se encontraron usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{usuarioEditar ? 'Editar Usuario' : 'Nuevo Usuario'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit} noValidate>
          <Modal.Body>
            {mensaje.texto && <Alert variant={mensaje.tipo}>{mensaje.texto}</Alert>}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombres</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombres"
                    placeholder="Ingrese nombres"
                    value={formData.nombres}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellidos</Form.Label>
                  <Form.Control
                    type="text"
                    name="apellidos"
                    placeholder="Ingrese apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>RUN (sin puntos ni guión)</Form.Label>
                  <Form.Control
                    type="text"
                    name="run"
                    placeholder="111111111"
                    maxLength={10}
                    value={formData.run}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono (opcional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="telefono"
                    placeholder="912345678"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select name="rol" value={formData.rol} onChange={handleChange}>
                    <option value="CLIENTE">CLIENTE</option>
                    <option value="VENDEDOR">VENDEDOR</option>
                    <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control
                type="email"
                name="correo"
                placeholder="nombre@vetsm.cl"
                value={formData.correo}
                onChange={handleChange}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {usuarioEditar ? 'Nueva Contraseña (Opcional, mín. 8)' : 'Contraseña (mín. 8 caracteres)'}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirmar Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    name="passwordConfirmar"
                    placeholder="Confirmar Contraseña"
                    value={formData.passwordConfirmar}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : usuarioEditar ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}