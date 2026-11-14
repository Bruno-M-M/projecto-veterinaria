import fs from "node:fs";

const archivo = process.argv[2];
const coleccion = JSON.parse(fs.readFileSync(archivo, "utf8"));

const bearer = (variable) => ({
    type: "bearer",
    bearer: [{ key: "token", value: `{{${variable}}}`, type: "string" }],
});
const sinToken = { type: "noauth" };

function peticion({ nombre, metodo, ruta, cuerpo, auth, pruebas }) {
    const header = cuerpo ? [{ key: "Content-Type", value: "application/json" }] : [];
    const req = {
        method: metodo,
        header,
        url: {
            raw: `{{baseUrl}}${ruta}`,
            host: ["{{baseUrl}}"],
            path: ruta.split("/").filter(Boolean),
        },
    };
    if (auth) req.auth = auth;
    if (cuerpo) {
        req.body = { mode: "raw", raw: cuerpo, options: { raw: { language: "json" } } };
    }
    return {
        name: nombre,
        event: [{ listen: "test", script: { type: "text/javascript", exec: pruebas } }],
        request: req,
    };
}

const conProducto = (cantidad) =>
    `{\n  "items": [\n    { "productoId": {{productoId}}, "cantidad": ${cantidad} }\n  ]\n}`;

const carpeta = {
    name: "3b. Descuento por lote",
    item: [
        peticion({
            nombre: "Reponer 5 unidades para tener stock (200)",
            metodo: "POST",
            ruta: "/api/v1/productos/{{productoId}}/reponer",
            cuerpo: '{\n  "cantidad": 5\n}',
            pruebas: ['pm.test("Responde 200", () => pm.response.to.have.status(200));'],
        }),
        peticion({
            nombre: "Guardar el stock antes de probar",
            metodo: "GET",
            ruta: "/api/v1/productos/{{productoId}}",
            pruebas: [
                'pm.test("Responde 200", () => pm.response.to.have.status(200));',
                'pm.collectionVariables.set("stockAntes", pm.response.json().stock);',
            ],
        }),
        peticion({
            nombre: "Lote con un producto inexistente (404)",
            metodo: "POST",
            ruta: "/api/v1/productos/descontar-lote",
            cuerpo: `{\n  "items": [\n    { "productoId": {{productoId}}, "cantidad": 1 },\n    { "productoId": 999999, "cantidad": 1 }\n  ]\n}`,
            pruebas: ['pm.test("Responde 404", () => pm.response.to.have.status(404));'],
        }),
        peticion({
            nombre: "Lote que pide más de lo que hay (409)",
            metodo: "POST",
            ruta: "/api/v1/productos/descontar-lote",
            cuerpo: conProducto(1000000),
            pruebas: [
                'pm.test("Responde 409", () => pm.response.to.have.status(409));',
                'pm.test("El mensaje explica el motivo", () => pm.expect(pm.response.json().mensaje).to.include("Stock insuficiente"));',
            ],
        }),
        peticion({
            nombre: "Después de los rechazos el stock no cambió",
            metodo: "GET",
            ruta: "/api/v1/productos/{{productoId}}",
            pruebas: [
                'pm.test("Responde 200", () => pm.response.to.have.status(200));',
                'pm.test("El stock es el mismo de antes", () => pm.expect(pm.response.json().stock).to.eql(Number(pm.collectionVariables.get("stockAntes"))));',
            ],
        }),
        peticion({
            nombre: "Lote válido de 2 unidades (200)",
            metodo: "POST",
            ruta: "/api/v1/productos/descontar-lote",
            cuerpo: conProducto(2),
            pruebas: [
                'pm.test("Responde 200", () => pm.response.to.have.status(200));',
                'pm.test("Descontó 2 unidades", () => pm.expect(pm.response.json()[0].stock).to.eql(Number(pm.collectionVariables.get("stockAntes")) - 2));',
            ],
        }),
        peticion({
            nombre: "Lote sin productos (400)",
            metodo: "POST",
            ruta: "/api/v1/productos/descontar-lote",
            cuerpo: '{\n  "items": []\n}',
            pruebas: [
                'pm.test("Responde 400", () => pm.response.to.have.status(400));',
                'pm.test("Indica el campo items", () => pm.expect(pm.response.json().errores).to.have.property("items"));',
            ],
        }),
        peticion({
            nombre: "Lote sin token (401)",
            metodo: "POST",
            ruta: "/api/v1/productos/descontar-lote",
            cuerpo: conProducto(1),
            auth: sinToken,
            pruebas: ['pm.test("Responde 401", () => pm.response.to.have.status(401));'],
        }),
        peticion({
            nombre: "Lote como VENDEDOR (403)",
            metodo: "POST",
            ruta: "/api/v1/productos/descontar-lote",
            cuerpo: conProducto(1),
            auth: bearer("tokenVendedor"),
            pruebas: ['pm.test("Responde 403", () => pm.response.to.have.status(403));'],
        }),
        peticion({
            nombre: "Lote como CLIENTE (200)",
            metodo: "POST",
            ruta: "/api/v1/productos/descontar-lote",
            cuerpo: conProducto(1),
            auth: bearer("tokenCliente"),
            pruebas: ['pm.test("Responde 200", () => pm.response.to.have.status(200));'],
        }),
    ],
};

if (!coleccion.variable.some((v) => v.key === "stockAntes")) {
    coleccion.variable.push({ key: "stockAntes", value: "" });
}

coleccion.item = coleccion.item.filter((i) => i.name !== carpeta.name);
const posicionLimpieza = coleccion.item.findIndex((i) => i.name.includes("Limpieza"));
coleccion.item.splice(posicionLimpieza === -1 ? coleccion.item.length : posicionLimpieza, 0, carpeta);

fs.writeFileSync(archivo, JSON.stringify(coleccion, null, 2) + "\n", "utf8");
console.log(`Listo: ${carpeta.item.length} casos de lote agregados a ${archivo}`);