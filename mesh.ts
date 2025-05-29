import { Vertex, ObjMesh, } from './obj';

export type WebGPUMeshBuffers = {
    vertexBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    indexCount: number;
};

export function createWebGPUMeshBuffers(device: GPUDevice, mesh: ObjMesh): WebGPUMeshBuffers {
    const vertexCount = mesh.vertices.length;
    const vertexData = new Float32Array(vertexCount * Vertex.stride);
    for (let i = 0; i < vertexCount; ++i) {
        const v = mesh.vertices[i];
        vertexData.set([
            ...[v.position.x, v.position.y, v.position.z],
            ...[v.normal.x, v.normal.y, v.normal.z],
            ...[v.tangent.x, v.tangent.y, v.tangent.z],
            ...[v.color.x, v.color.y, v.color.z, v.color.w],
            ...[v.uv.x, v.uv.y],
        ], i * Vertex.stride);
    }
    const vertexBuffer = device.createBuffer({
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
    });
    new Float32Array(vertexBuffer.getMappedRange()).set(vertexData);
    vertexBuffer.unmap();

    const indexData = new Uint32Array(mesh.indices);
    const indexBuffer = device.createBuffer({
        size: indexData.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
    });
    new Uint32Array(indexBuffer.getMappedRange()).set(indexData);
    indexBuffer.unmap();

    return {
        vertexBuffer,
        indexBuffer,
        indexCount: mesh.indices.length,
    };
}