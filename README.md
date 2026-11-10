# Veterinaria San Marcos

Tienda online de la **Veterinaria San Marcos**: un frontend en React que consume servicios de backend en Spring Boot sobre una base de datos Oracle. Proyecto de la asignatura *DSY1104 Desarrollo FullStack II* (Duoc UC), Evaluación Parcial 3.

**Equipo:** Alfonso Pizarro, Bruno Mateluna y Benjamín Martínez.

## Estructura del repositorio

| Carpeta | Contenido |
|---|---|
| `fase1-html/` | Primera entrega: el sitio en HTML, CSS y JavaScript |
| `fase2-react/` | El sitio migrado a React (Vite), conectado a la API |
| `fase3-backend/productos-service/` | Servicio de categorías, productos y stock (puerto 8081) |

Los servicios `auth-service` (usuarios, login y JWT, puerto 8082) y `ventas-service` (boletas, puerto 8083) se desarrollan en sus ramas y se incorporan a `main` a medida que se fusionan.

## Arquitectura

```
Navegador (React, :5173)
      |  /api/v1/...
      v
Proxy (Vite en desarrollo; Nginx previsto en producción)
      |--> productos-service  :8081
      |--> auth-service       :8082
      '--> ventas-service     :8083
                |
                v
        Base Oracle (OCI)
```

El frontend nunca habla con la base de datos: solo los servicios. Todas las rutas están versionadas bajo `/api/v1`.

## Requisitos

- Java 21 (el proyecto incluye Maven Wrapper, no hace falta instalar Maven).
- Node.js 20.19 o superior (o 22.12 o superior), por requisito de Vite.
- Una base Oracle Autonomous Database con su *wallet* (los archivos `tnsnames.ora`, `cwallet.sso` y `ewallet.p12`).
- Docker, solo si se quiere ejecutar el servicio en un contenedor.

## Ejecutar productos-service

El servicio no guarda ninguna clave en el código: toda la configuración llega por variables de entorno.

| Variable | Qué contiene |
|---|---|
| `DB_SERVICIO` | Nombre del servicio, tal como aparece en `tnsnames.ora` |
| `WALLET_DIR` | Carpeta del wallet, escrita con barras `/` |
| `DB_USER` | Usuario de la base |
| `DB_PASSWORD` | Contraseña de la base |

**El wallet y las contraseñas nunca se suben al repositorio.** Se guardan fuera de la carpeta del proyecto.

Con las variables definidas (en IntelliJ: *Run > Edit Configurations > Environment variables*), desde `fase3-backend/productos-service`:

```bash
./mvnw spring-boot:run
```

El servicio arranca en `http://localhost:8081`. La primera vez crea las tablas `categoria` y `producto` y carga 22 productos y 9 categorías; en los siguientes arranques no duplica nada.

### Con Docker

```bash
docker build -t productos-service .
docker run --rm -p 8081:8081 --env-file productos.env -v <carpeta-del-wallet>:/wallet:ro productos-service
```

En el archivo `productos.env` van las cuatro variables, con `WALLET_DIR=/wallet`. El wallet se monta como volumen y no se incluye en la imagen.

### Documentación de la API

Con el servicio en marcha, Swagger queda en `http://localhost:8081/swagger-ui.html` (la descripción en JSON, en `/v3/api-docs`).

| Método y ruta | Qué hace |
|---|---|
| `GET /api/v1/categorias` | Lista las categorías |
| `GET /api/v1/categorias/{id}` | Una categoría |
| `POST /api/v1/categorias` | Crea una categoría |
| `PUT /api/v1/categorias/{id}` | Edita una categoría |
| `DELETE /api/v1/categorias/{id}` | Elimina una categoría (409 si tiene productos) |
| `GET /api/v1/productos` | Lista los productos; filtro opcional `?categoriaId=` |
| `GET /api/v1/productos/{id}` | Un producto por su id |
| `GET /api/v1/productos/codigo/{codigo}` | Un producto por su código |
| `GET /api/v1/productos/stock-critico` | Productos con stock menor o igual al crítico |
| `POST /api/v1/productos` | Crea un producto |
| `PUT /api/v1/productos/{id}` | Edita un producto |
| `DELETE /api/v1/productos/{id}` | Elimina un producto |
| `POST /api/v1/productos/{id}/descontar` | Resta stock (409 si no alcanza o el producto está desactivado) |
| `POST /api/v1/productos/{id}/reponer` | Suma stock (también en productos desactivados, para devolver el de una boleta anulada) |

Los errores salen siempre con el mismo formato: `fecha`, `estado`, `error`, `mensaje`, `ruta` y, en los 400 de validación, `errores` con el detalle por campo.

## Ejecutar el frontend

Desde `fase2-react`:

```bash
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`. En desarrollo, Vite reenvía las rutas `/api/v1/...` a cada servicio (productos al 8081, auth al 8082 y boletas al 8083), así que no hace falta configurar CORS. La variable `VITE_API_URL` (ver `.env.example`) se deja vacía en desarrollo.

El catálogo y el panel de administración necesitan `productos-service` en marcha. La tienda solo muestra los productos activos; el panel los ve todos. Mientras la sesión con JWT no esté integrada, el panel (`/admin`) se protege con una bandera local heredada de la versión anterior.

## Pruebas

| Qué | Comando (desde la carpeta indicada) | Resultado actual |
|---|---|---|
| Backend, JUnit y MockMvc (`fase3-backend/productos-service`) | `./mvnw test` | 16 pruebas, sin necesidad de Oracle |
| Frontend, Vitest y Testing Library (`fase2-react`) | `npm run test:run` | 211 pruebas en 23 archivos |
| Cobertura del frontend (`fase2-react`) | `npm run test:coverage` | Falla si alguna métrica baja del 90 % |
| Colección de Postman (`fase3-backend/productos-service/postman`) | `npx newman run productos-service.postman_collection.json` | 42 peticiones y 81 comprobaciones |

La colección de Postman se puede importar también en la aplicación. Crea y elimina sus propios datos de prueba, y la variable `baseUrl` permite apuntarla a otro servidor.

## Estado del proyecto

| Parte | Responsable | Estado |
|---|---|---|
| `productos-service`: API, errores, stock, Swagger, carga inicial, Dockerfile y pruebas | Bruno | En `main` |
| Frontend: catálogo, detalle, carrito con tope de stock y panel de productos (crear, editar, eliminar) | Bruno | En `main` |
| `auth-service`: usuarios, login, JWT y roles | Benjamín | En desarrollo |
| `ventas-service`: boletas y descuento de stock | Alfonso | En desarrollo |
| Seguridad (401 y 403) y restricciones por rol en el frontend | Equipo | Pendiente del módulo de autenticación |
| Despliegue en AWS | Equipo | Pendiente |

## Flujo de trabajo

- Una rama por tarea con el formato `feature/<persona>-<tema>`.
- Mensajes de commit con *Conventional Commits*: `feat:`, `fix:`, `test:`, `chore:`, `refactor:` y `docs:`.
- Pull request a `main` con revisión cruzada entre integrantes.
- Nunca se suben claves, archivos `.env` ni el wallet de la base de datos.
