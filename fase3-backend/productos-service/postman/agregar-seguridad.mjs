import fs from "node:fs";

const archivo = process.argv[2];
const coleccion = JSON.parse(fs.readFileSync(archivo, "utf8"));

// token de administrador para todas las peticiones existentes
coleccion.auth = {
    type: "bearer",
    bearer: [{ key: "token", value: "{{tokenAdmin}}", type: "string" }],
};

// variables para los tokens (se pegan a mano desde el login de auth-service)
for (const clave of ["tokenAdmin", "tokenVendedor", "tokenCliente"]) {
    if (!coleccion.variable.some((v) => v.key === clave)) {
        coleccion.variable.push({ key: clave, value: "" });
    }
}

// descripción
coleccion.info.description =
    coleccion.info.description.replace(/\n\nPendiente:[\s\S]*$/, "") +
    "\n\nSeguridad: pegar en las variables tokenAdmin, tokenVendedor y tokenCliente un token de " +
    "acceso de cada rol (login en auth-service, puerto 8082). Las carpetas 1 a 4 usan tokenAdmin; " +
    "la carpeta 5 prueba los casos sin token (401) y con un rol sin permiso (403).";

// carpeta de seguridad
const bearer = (variable) => ({
    type: "bearer",
    bearer: [{ key: "token", value: `{{${variable}}}`, type: "string" }],
});

function caso({ nombre, metodo, ruta, estado, auth, cuerpo, cabeceras = [] }) {
    const header = [...cabeceras];
    if (cuerpo) header.push({ key: "Content-Type", value: "application/json" });

    const peticion = {
        method: metodo,
        header,
        auth,
        url: {
            raw: `{{baseUrl}}${ruta}`,
            host: ["{{baseUrl}}"],
            path: ruta.split("/").filter(Boolean),
        },
    };
    if (cuerpo) {
        peticion.body = { mode: "raw", raw: cuerpo, options: { raw: { language: "json" } } };
    }

    const exec = [`pm.test("Responde ${estado}", () => pm.response.to.have.status(${estado}));`];
    if (estado === 401 || estado === 403) {
        exec.push(
            `pm.test("El cuerpo trae estado ${estado} y un mensaje", () => { const c = pm.response.json(); pm.expect(c.estado).to.eql(${estado}); pm.expect(c.mensaje).to.be.a("string"); });`,
        );
    }

    return { name: nombre, event: [{ listen: "test", script: { type: "text/javascript", exec } }], request: peticion };
}

const sinToken = { type: "noauth" };
const producto = '{\n  "codigo": "ZP999",\n  "nombre": "Prueba",\n  "descripcion": "Prueba",\n  "precio": 1000,\n  "stock": 5,\n  "stockCritico": 1,\n  "activo": true,\n  "categoriaId": 1\n}';
const categoria = '{\n  "nombre": "ZP-Seguridad"\n}';
const cantidad = '{\n  "cantidad": 1\n}';

const carpeta = {
    name: "5. Seguridad",
    item: [
        caso({ nombre: "Listar productos sin token (200, la tienda es pública)", metodo: "GET", ruta: "/api/v1/productos", estado: 200, auth: sinToken }),
        caso({ nombre: "Crear categoría sin token (401)", metodo: "POST", ruta: "/api/v1/categorias", estado: 401, auth: sinToken, cuerpo: categoria }),
        caso({ nombre: "Crear producto sin token (401)", metodo: "POST", ruta: "/api/v1/productos", estado: 401, auth: sinToken, cuerpo: producto }),
        caso({ nombre: "Crear producto con token mal formado (401)", metodo: "POST", ruta: "/api/v1/productos", estado: 401, auth: sinToken, cuerpo: producto, cabeceras: [{ key: "Authorization", value: "Bearer esto-no-es-un-jwt" }] }),
        caso({ nombre: "Crear producto como VENDEDOR (403)", metodo: "POST", ruta: "/api/v1/productos", estado: 403, auth: bearer("tokenVendedor"), cuerpo: producto }),
        caso({ nombre: "Crear producto como CLIENTE (403)", metodo: "POST", ruta: "/api/v1/productos", estado: 403, auth: bearer("tokenCliente"), cuerpo: producto }),
        caso({ nombre: "Crear categoría como VENDEDOR (403)", metodo: "POST", ruta: "/api/v1/categorias", estado: 403, auth: bearer("tokenVendedor"), cuerpo: categoria }),
        caso({ nombre: "Eliminar producto como CLIENTE (403)", metodo: "DELETE", ruta: "/api/v1/productos/1", estado: 403, auth: bearer("tokenCliente") }),
        caso({ nombre: "Stock crítico como CLIENTE (403)", metodo: "GET", ruta: "/api/v1/productos/stock-critico", estado: 403, auth: bearer("tokenCliente") }),
        caso({ nombre: "Stock crítico como VENDEDOR (200)", metodo: "GET", ruta: "/api/v1/productos/stock-critico", estado: 200, auth: bearer("tokenVendedor") }),
        caso({ nombre: "Descontar sin token (401)", metodo: "POST", ruta: "/api/v1/productos/1/descontar", estado: 401, auth: sinToken, cuerpo: cantidad }),
        caso({ nombre: "Descontar como VENDEDOR (403)", metodo: "POST", ruta: "/api/v1/productos/1/descontar", estado: 403, auth: bearer("tokenVendedor"), cuerpo: cantidad }),
        caso({ nombre: "Reponer como CLIENTE (403)", metodo: "POST", ruta: "/api/v1/productos/1/reponer", estado: 403, auth: bearer("tokenCliente"), cuerpo: cantidad }),
    ],
};

coleccion.item = coleccion.item.filter((i) => i.name !== carpeta.name);
coleccion.item.push(carpeta);

fs.writeFileSync(archivo, JSON.stringify(coleccion, null, 2) + "\n", "utf8");
console.log(`Listo: ${carpeta.item.length} casos de seguridad agregados a ${archivo}`);