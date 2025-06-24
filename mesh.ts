import { float2, float3, float4 } from "./math";

export class Vertex {
    constructor(
        public position: float3,
        public normal: float3,
        public tangent: float3,
        public color: float4,
        public uv: float2
    ) {}
    static default() {
        return new Vertex(float3.zero(), float3.zero(), float3.zero(), new float4(1,1,1,1), float2.zero());
    }
    static readonly stride : number = 3 + 3 + 3 + 4 + 2; // pos(3)+normal(3)+tangent(3)+color(4)+uv(2)
}
export class ObjMesh {
    constructor(
        public vertices: Vertex[],
        public indices: number[]
    ) {}
}

export type WebGPUMeshBuffers = {
    vertexBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    indexCount: number;
    attributes: GPUVertexAttribute[];
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
        attributes: [
            { shaderLocation: 0, offset: 0,  format: 'float32x3' }, // position
            { shaderLocation: 1, offset: 12, format: 'float32x3' }, // normal
            { shaderLocation: 2, offset: 24, format: 'float32x3' }, // tangent
            { shaderLocation: 3, offset: 36, format: 'float32x4' }, // color
            { shaderLocation: 4, offset: 52, format: 'float32x2' }, // uv
        ],
    };
}

