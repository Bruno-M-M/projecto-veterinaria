import clienteApi from "./client.js";

export async function crearBoleta(items) {
    const { data } = await clienteApi.post("/api/v1/boletas", {
        items: items.map((item) => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
        })),
    });
    return data;
}

export async function listarBoletas() {
    const { data } = await clienteApi.get("/api/v1/boletas");
    return data;
}

export async function obtenerBoleta(id) {
    const { data } = await clienteApi.get(`/api/v1/boletas/${id}`);
    return data;
}

export async function misCompras() {
    const { data } = await clienteApi.get("/api/v1/boletas/mias");
    return data;
}

export async function anularBoleta(id) {
    const { data } = await clienteApi.patch(`/api/v1/boletas/${id}/anular`);
    return data;
}