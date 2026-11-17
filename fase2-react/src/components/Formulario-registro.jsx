import { useState } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { registrarUsuario } from '../api/auth.js';
import { mensajeDeError } from '../api/errores.js';

// Datos de regiones y comunas
const regionesData = [
  {
    region: "Arica y Parinacota",
    comunas: ["Arica", "Camarones", "Putre", "General Lagos"]
  },
  {
    region: "Tarapacá",
    comunas: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"]
  },
  {
    region: "Antofagasta",
    comunas: ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"]
  },
  {
    region: "Atacama",
    comunas: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"]
  },
  {
    region: "Coquimbo",
    comunas: ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paihuano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"]
  },
  {
    region: "Valparaíso",
    comunas: ["Valparaíso", "Viña del Mar", "Concón", "Quilpué", "Villa Alemana", "Limache", "Olmué", "Quillota", "San Antonio", "Los Andes", "San Felipe"]
  },
  {
    region: "Metropolitana de Santiago",
    comunas: ["Santiago", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "San Bernardo"]
  },
  {
    region: "O'Higgins",
    comunas: ["Rancagua", "Machalí", "Graneros", "San Fernando", "Santa Cruz", "Pichilemu"]
  },
  {
    region: "Maule",
    comunas: ["Talca", "Curicó", "Linares", "Constitución", "Cauquenes"]
  },
  {
    region: "Ñuble",
    comunas: ["Chillán", "Bulnes", "Chillán Viejo", "El Carmen", "Pemuco", "Pinto", "Quillón", "San Ignacio", "Yungay"]
  },
  {
    region: "Biobío",
    comunas: ["Concepción", "Talcahuano", "San Pedro de la Paz", "Chiguayante", "Coronel", "Lota", "Hualpén", "Los Ángeles"]
  },
  {
    region: "Araucanía",
    comunas: ["Temuco", "Padre Las Casas", "Villarrica", "Pucón", "Angol"]
  },
  {
    region: "Los Ríos",
    comunas: ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Río Bueno"]
  },
  {
    region: "Los Lagos",
    comunas: ["Puerto Montt", "Puerto Varas", "Castro", "Ancud", "Osorno"]
  },
  {
    region: "Aysén",
    comunas: ["Coyhaique", "Puerto Aysén", "Chile Chico", "Cochrane"]
  },
  {
    region: "Magallanes y de la Antártica Chilena",
    comunas: ["Punta Arenas", "Puerto Natales", "Porvenir", "Cabo de Hornos"]
  }
];

// Función de validación de RUN (Módulo 11)
const validarRUN = (run) => {
  const regExp = /^[0-9]{7,8}[0-9kK]$/;
  if (!regExp.test(run)) return false;

  const cuerpo = run.slice(0, -1);
  let dv = run.slice(-1).toUpperCase();

  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = suma % 11;
  let dvEsperado = 11 - resto;

  if (dvEsperado === 11) {
    dvEsperado = "0";
  } else if (dvEsperado === 10) {
    dvEsperado = "K";
  } else {
    dvEsperado = dvEsperado.toString();
  }

  return dv === dvEsperado;
};

export default function FormularioRegistro() {
  const estadoInicial = {
    nombres: '',
    apellidos: '',
    run: '',
    correo: '',
    correoConfirmar: '',
    region: '',
    comuna: '',
    password: '',
    passwordConfirmar: ''
  };

  const [formData, setFormData] = useState(estadoInicial);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [enviando, setEnviando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'region') {
        updated.comuna = '';
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nombres = formData.nombres.trim();
    const apellidos = formData.apellidos.trim();
    const run = formData.run.trim();
    const correoReg = formData.correo.trim();
    const correoConf = formData.correoConfirmar.trim();
    const region = formData.region;
    const comuna = formData.comuna;
    const pwdReg = formData.password.trim();
    const pwdConf = formData.passwordConfirmar.trim();

    const error = (texto) => setMensaje({ tipo: 'danger', texto });

    // 1. Campos vacíos
    if (
        nombres === "" || apellidos === "" || run === "" || correoReg === "" || correoConf === "" ||
        region === "" || comuna === "" || pwdReg === "" || pwdConf === ""
    ) {
      return error('Debe completar todos los campos.');
    }

    // 2. Validación de RUN (Módulo 11)
    if (!validarRUN(run)) {
      return error('El RUN ingresado no es válido. Ingréselo sin puntos ni guión (ej: 12345678K).');
    }

    // 3. Región y comuna válidas
    const objetoRegion = regionesData.find((item) => item.region === region);
    if (!objetoRegion || !objetoRegion.comunas.includes(comuna)) {
      return error('Debe seleccionar una región y comuna válidas.');
    }

    // 4. Nombres y apellidos (el backend permite hasta 80 caracteres cada uno)
    if (nombres.length > 80 || apellidos.length > 80) {
      return error('Los nombres y los apellidos deben tener como máximo 80 caracteres.');
    }

    const soloLetrasYEspacios = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!soloLetrasYEspacios.test(nombres) || !soloLetrasYEspacios.test(apellidos)) {
      return error('El nombre solo debe contener caracteres alfabéticos y espacios.');
    }

    // 5. Correo (longitud, dominio y confirmación)
    if (correoReg.length > 100) {
      return error('El correo electrónico debe contener un máximo de 100 caracteres.');
    }

    const dominiosPermitidos = ["@duoc.cl", "@profesor.duoc.cl", "@gmail.com"];
    const esDominioValido = dominiosPermitidos.some((dominio) =>
        correoReg.toLowerCase().endsWith(dominio)
    );
    if (!esDominioValido) {
      return error('El correo debe pertenecer a uno de los dominios permitidos: @duoc.cl, @profesor.duoc.cl o @gmail.com.');
    }

    if (correoReg !== correoConf) {
      return error('Los correos electrónicos no coinciden.');
    }

    // 6. Contraseña: el backend exige entre 8 y 72 caracteres
    if (pwdReg.length < 8 || pwdReg.length > 72) {
      return error('La contraseña debe tener entre 8 y 72 caracteres.');
    }

    if (pwdReg !== pwdConf) {
      return error('Las contraseñas no coinciden.');
    }

    // 7. Enviar a auth-service: POST /api/v1/auth/registro
    setEnviando(true);
    try {
      await registrarUsuario({
        run,
        nombres,
        apellidos,
        correo: correoReg.toLowerCase(),
        clave: pwdReg,
        region,
        comuna,
      });
      setMensaje({ tipo: 'success', texto: '¡Registro exitoso! Ya puedes iniciar sesión.' });
      setFormData(estadoInicial);
    } catch (err) {
      error(mensajeDeError(err, 'No se pudo completar el registro.'));
    } finally {
      setEnviando(false);
    }
  };

  const regionEncontrada = regionesData.find((item) => item.region === formData.region);
  const comunasDisponibles = regionEncontrada ? regionEncontrada.comunas : [];

  return (
      <Form className="border rounded p-4 shadow bg-white" noValidate onSubmit={handleSubmit}>
        <h2 className="text-center mb-4">Registro de usuario</h2>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="nombreRegistro">
              <Form.Label>Nombres</Form.Label>
              <Form.Control
                  type="text"
                  name="nombres"
                  placeholder="Ingrese sus nombres"
                  maxLength={80}
                  value={formData.nombres}
                  onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="apellidoRegistro">
              <Form.Label>Apellidos</Form.Label>
              <Form.Control
                  type="text"
                  name="apellidos"
                  placeholder="Ingrese sus apellidos"
                  maxLength={80}
                  value={formData.apellidos}
                  onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3" controlId="runRegistro">
          <Form.Label>RUN (sin puntos ni guión)</Form.Label>
          <Form.Control
              type="text"
              name="run"
              placeholder="12345678K"
              maxLength={10}
              value={formData.run}
              onChange={handleChange}
          />
        </Form.Group>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="correoRegistro">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control
                  type="email"
                  name="correo"
                  placeholder="nombre@duoc.cl"
                  maxLength={100}
                  value={formData.correo}
                  onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="correoConfirmar">
              <Form.Label>Confirmar Correo Electrónico</Form.Label>
              <Form.Control
                  type="email"
                  name="correoConfirmar"
                  placeholder="nombre@duoc.cl"
                  maxLength={100}
                  value={formData.correoConfirmar}
                  onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="regionRegistro">
              <Form.Label>Región</Form.Label>
              <Form.Select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
              >
                <option value="" disabled>
                  Seleccione una región
                </option>
                {regionesData.map((item) => (
                    <option key={item.region} value={item.region}>
                      {item.region}
                    </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="comunaRegistro">
              <Form.Label>Comuna</Form.Label>
              <Form.Select
                  name="comuna"
                  disabled={!formData.region}
                  value={formData.comuna}
                  onChange={handleChange}
              >
                <option value="" disabled>
                  {formData.region ? 'Seleccione una comuna' : 'Seleccione primero una región'}
                </option>
                {comunasDisponibles.map((comuna) => (
                    <option key={comuna} value={comuna}>
                      {comuna}
                    </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Contraseña</Form.Label>
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
            <Form.Group className="mb-3" controlId="passwordConfirmar">
              <Form.Label>Confirmar Contraseña</Form.Label>
              <Form.Control
                  type="password"
                  name="passwordConfirmar"
                  placeholder="Contraseña"
                  value={formData.passwordConfirmar}
                  onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Button type="submit" variant="primary" className="w-100 mt-2" disabled={enviando}>
          {enviando ? 'Registrando...' : 'Registrar'}
        </Button>

        {mensaje.texto && (
            <Alert variant={mensaje.tipo} className="mt-4">
              {mensaje.texto}
            </Alert>
        )}
      </Form>
  );
}