# Veterinaria San Marcos

Tienda online de la **Veterinaria San Marcos**: un frontend en React que consume tres microservicios Spring Boot sobre una base de datos Oracle, desplegado con Docker Compose y Nginx en AWS. Proyecto de la asignatura *DSY1104 Desarrollo FullStack II* (Duoc UC), Evaluación Parcial 3.

**Equipo:** Alfonso Pizarro, Bruno Mateluna y Benjamín Martínez.

## Qué incluye

- Catálogo público de productos y categorías, con carrito que respeta el stock.
- Registro, inicio de sesión y renovación de sesión con **JWT**, con tres roles: `ADMINISTRADOR`, `VENDEDOR` y `CLIENTE`.
- Compra con boleta: el stock se descuenta en `productos-service`, todo o nada, y se devuelve al anular una boleta.
- Panel de administración (productos, usuarios, órdenes y comentarios) y vista del vendedor (productos de solo lectura y órdenes).
- «Mis compras» para el cliente.
- Seguridad por rol en el backend (respuestas 401 y 403) y en el frontend (rutas protegidas).
- Despliegue reproducible en AWS, con prueba de humo y script de actualización.

## Arquitectura

```
Navegador (React)
      |  /api/v1/...
      v
Nginx :80  (sirve el frontend y reparte las rutas)
      |--> productos-service  :8081   /api/v1/productos, /api/v1/categorias
      |--> auth-service       :8082   /api/v1/auth, /api/v1/usuarios
      '--> ventas-service     :8083   /api/v1/boletas
                |
                v
   Oracle Autonomous Database (wallet mTLS)
```

- Cada servicio es dueño de sus tablas y pide a los otros lo que necesita por API (ventas llama a productos para precio y stock).
- El token lo emite `auth-service`; los tres servicios lo validan con la misma clave `JWT_SECRET`.
- En producción los puertos 8081 a 8083 quedan solo en `127.0.0.1`: desde internet se llega únicamente por Nginx.
- El frontend nunca habla con la base de datos. Todas las rutas están versionadas bajo `/api/v1`.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, React Bootstrap, Axios |
| Backend | Java 21, Spring Boot 4.1, Spring Security (JWT HS256), Spring Data JPA, Springdoc OpenAPI |
| Base de datos | Oracle Autonomous Database (conexión con wallet) |
| Pruebas | JUnit y MockMvc (backend), Vitest y Testing Library (frontend), Postman y Newman |
| Despliegue | Docker, Docker Compose, Nginx, AWS EC2 |

## Estructura del repositorio

| Carpeta | Contenido |
|---|---|
| `fase1-html/` | Primera entrega: el sitio en HTML, CSS y JavaScript |
| `fase2-react/` | El sitio en React (Vite), conectado a la API |
| `fase3-backend/productos-service/` | Categorías, productos y stock (puerto 8081) |
| `fase3-backend/auth-service/` | Usuarios, login, renovación de token y roles (puerto 8082) |
| `fase3-backend/ventas-service/` | Boletas y descuento de stock (puerto 8083) |
| `fase3-backend/nginx/` | Configuración de Nginx |
| `fase3-backend/docker-compose.yml` | Los tres servicios y Nginx |
| `docs/evidencia/` | Evidencia del despliegue en AWS, con capturas |

## Roles y permisos

| Acción | Público | Cliente | Vendedor | Administrador |
|---|:-:|:-:|:-:|:-:|
| Ver productos y categorías | Sí | Sí | Sí | Sí |
| Comprar y generar boleta | No | Sí | No | Sí |
| Ver sus propias compras | No | Sí | No | No |
| Ver todas las órdenes | No | No | Sí | Sí |
| Anular una orden | No | No | No | Sí |
| Ver productos con stock crítico | No | No | Sí | Sí |
| Crear, editar y eliminar productos y categorías | No | No | No | Sí |
| Administrar usuarios | No | No | No | Sí |

## API

Con cada servicio en marcha, Swagger queda en `http://localhost:<puerto>/swagger-ui.html` (JSON en `/v3/api-docs`). En producción Nginx no expone Swagger.

Los errores salen siempre con el mismo formato: `fecha`, `estado`, `error`, `mensaje`, `ruta` y, en los 400 de validación, `errores` con el detalle por campo.

### auth-service (8082)

| Método y ruta | Rol | Qué hace |
|---|---|---|
| `POST /api/v1/auth/registro` | Público | Registra un cliente |
| `POST /api/v1/auth/login` | Público | Devuelve `accessToken` y `refreshToken` |
| `POST /api/v1/auth/refresh` | Público | Renueva el token de acceso |
| `GET /api/v1/usuarios` y `GET /api/v1/usuarios/{id}` | Administrador | Lista y detalle de usuarios |
| `POST /api/v1/usuarios` y `PUT /api/v1/usuarios/{id}` | Administrador | Crea y edita usuarios |
| `PATCH /api/v1/usuarios/{id}/activar` y `/desactivar` | Administrador | Activa o desactiva un usuario |

### productos-service (8081)

| Método y ruta | Rol | Qué hace |
|---|---|---|
| `GET /api/v1/categorias` y `/{id}` | Público | Lista y detalle de categorías |
| `POST`, `PUT` y `DELETE /api/v1/categorias` | Administrador | Gestiona categorías (409 si tiene productos) |
| `GET /api/v1/productos` | Público | Lista productos; filtro opcional `?categoriaId=` |
| `GET /api/v1/productos/{id}` y `/codigo/{codigo}` | Público | Un producto por id o por código |
| `GET /api/v1/productos/stock-critico` | Administrador y vendedor | Productos con stock menor o igual al crítico |
| `POST`, `PUT` y `DELETE /api/v1/productos` | Administrador | Gestiona productos |
| `POST /api/v1/productos/{id}/descontar` | Administrador y cliente | Resta stock (409 si no alcanza o está desactivado) |
| `POST /api/v1/productos/descontar-lote` | Administrador y cliente | Descuenta varios productos a la vez; si alguno falla, no cambia ninguno (409) |
| `POST /api/v1/productos/{id}/reponer` | Administrador | Suma stock, también en productos desactivados (devolución de una boleta anulada) |

### ventas-service (8083)

| Método y ruta | Rol | Qué hace |
|---|---|---|
| `POST /api/v1/boletas` | Administrador y cliente | Compra: valida y descuenta stock, y genera la boleta |
| `GET /api/v1/boletas/mias` | Cliente | Boletas del usuario autenticado |
| `GET /api/v1/boletas` y `/{id}` | Administrador y vendedor | Lista y detalle de órdenes |
| `PATCH /api/v1/boletas/{id}/anular` | Administrador | Anula la boleta y repone el stock |

## Requisitos

- Java 21 (el proyecto incluye Maven Wrapper).
- Node.js 20.19 o superior (o 22.12 o superior), por requisito de Vite.
- Una Oracle Autonomous Database con su *wallet* (`tnsnames.ora`, `cwallet.sso` y `ewallet.p12`).
- Docker, solo para ejecutar en contenedores.

## Ejecutar en local

Ningún servicio guarda claves en el código: toda la configuración llega por variables de entorno.

| Variable | Qué contiene | Quién la usa |
|---|---|---|
| `DB_SERVICIO` | Alias del servicio, como aparece en `tnsnames.ora` | Los tres |
| `WALLET_DIR` | Carpeta del wallet, con barras `/` | Los tres |
| `DB_USER` y `DB_PASSWORD` | Usuario y contraseña de la base | Los tres |
| `JWT_SECRET` | Clave de firma, de 32 caracteres o más. **Idéntica en los tres** | Los tres |
| `CORS_ORIGINS` | Orígenes permitidos del frontend (opcional) | Los tres |
| `ADMIN_RUN`, `ADMIN_CORREO` y `ADMIN_CLAVE` | Primer administrador, solo si todavía no existe ninguno | `auth-service` |
| `PRODUCTOS_URL` | Dirección de `productos-service` | `ventas-service` |

**El wallet, los archivos `.env` y las llaves `.pem` nunca se suben al repositorio.**

Cada servicio se levanta desde su carpeta:

```bash
./mvnw spring-boot:run
```

En el primer arranque, `productos-service` crea sus tablas y carga 22 productos con sus categorías, y `auth-service` crea los tres roles y el administrador inicial. En los siguientes arranques no duplican nada.

El frontend, desde `fase2-react`:

```bash
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`. En desarrollo, Vite reenvía las rutas `/api/v1/...` a cada servicio, así que no hace falta configurar CORS. La variable `VITE_API_URL` (ver `.env.example`) se deja vacía.

## Pruebas

| Qué | Comando (desde la carpeta indicada) |
|---|---|
| Backend, JUnit y MockMvc (cada servicio en `fase3-backend/`) | `./mvnw test`, sin necesidad de Oracle |
| Frontend, Vitest y Testing Library (`fase2-react`) | `npm run test:run` |
| Cobertura del frontend (`fase2-react`) | `npm run test:coverage`, falla si una métrica baja del 90 % |
| Postman de productos (`fase3-backend/productos-service/postman`) | `npx newman run productos-service.postman_collection.json` |

La colección de Postman crea y elimina sus propios datos de prueba, y la variable `baseUrl` permite apuntarla a otro servidor.

## Despliegue en AWS

El sistema corre en una instancia EC2 con Docker Compose: Nginx en el puerto 80 sirve el frontend y redirige `/api/v1/...` a los tres servicios, que se conectan a Oracle Autonomous Database con wallet. La base permite el acceso solo desde la IP del servidor.

- Configuración: [`docker-compose.yml`](fase3-backend/docker-compose.yml) y [`nginx/default.conf`](fase3-backend/nginx/default.conf).
- Actualizar el servidor: [`actualizar.sh`](fase3-backend/actualizar.sh). Verificar que todo responde: [`prueba-humo.sh`](fase3-backend/prueba-humo.sh).
- Paso a paso con capturas: [`docs/evidencia/despliegue.md`](docs/evidencia/despliegue.md).

## Estado del proyecto

| Parte | Responsable | Estado |
|---|---|---|
| `productos-service`: API, stock, descuento por lote, seguridad, Swagger, carga inicial y pruebas | Bruno | Terminado |
| `auth-service`: registro, login, renovación de token, usuarios y roles | Benjamín | Terminado |
| `ventas-service`: compra, boletas, anulación y «mis compras» | Alfonso | Terminado |
| Frontend: catálogo, carrito, checkout, órdenes, panel de administración y vista del vendedor | Equipo | Terminado, salvo «Servicios» |
| Despliegue en AWS | Bruno | Desplegado |
| Página «Servicios» | Bruno | Pendiente (ver hoja de ruta) |

## Hoja de ruta

Mejoras planeadas, en el orden en que se abordarán.

### 1. Comentarios en la base de datos
Hoy los comentarios del blog se guardan en el navegador (`localStorage`). Se moverán a una tabla `comentario` en Oracle, con rutas para publicar (público), listar los aprobados (público) y moderar (administrador), y el panel de administración dejará de depender de `localStorage`.

### 2. Reserva de horas (`citas-service`)
Un cuarto servicio (puerto 8084) para agendar citas con el profesional:

- Catálogo de **servicios** con duración y precio, que reemplaza la página «Pendiente».
- Agenda en bloques de 30 minutos por profesional. Un **índice único en la base de datos** impide dos citas en el mismo bloque.
- El cliente elige mascota, servicio, profesional, fecha y una hora libre; puede cancelar dentro de un margen configurable.
- Vista del profesional para ver su agenda y marcar asistencia.

### 3. Mejoras técnicas
- Migraciones de base de datos con Flyway, en lugar de `ddl-auto=update`.
- Integración continua con GitHub Actions (pruebas del backend y del frontend en cada PR).
- Colecciones de Postman para `auth-service` y `ventas-service`.
- Documento de integración con el contrato de las rutas entre servicios.
- Servir el frontend desde una imagen de Nginx construida en la propia pipeline, sin copiar `dist/` a mano.

## Flujo de trabajo

- Una rama por tarea con el formato `feature/<persona>-<tema>`.
- Mensajes de commit con *Conventional Commits*: `feat:`, `fix:`, `test:`, `chore:`, `refactor:` y `docs:`.
- Pull request a `main` con revisión cruzada entre integrantes.
- Nunca se suben claves, archivos `.env`, el wallet de la base ni llaves `.pem`.
