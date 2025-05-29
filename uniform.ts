export class Matrices {
    public readonly buffer: GPUBuffer;
    public readonly bindGroupLayout: GPUBindGroupLayout;
    public readonly bindGroup: GPUBindGroup;

    public constructor(device: GPUDevice) {
        this.buffer = device.createBuffer({
            size: 16 * 4 * 3, // 3つのmat4x4<f32>
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.bindGroupLayout = device.createBindGroupLayout({
            entries: [ { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }, ],
        });
        this.bindGroup = device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.buffer } },
            ],
        });
    }

    public updateMatricesUniformBuffer(device: GPUDevice, t: number): void {
        device.queue.writeBuffer(this.buffer, 0, new Float32Array([
            ...Matrices.makeModelMatrix(t, [0.3, 1, 0]),
            ...Matrices.makeViewMatrix(),
            ...Matrices.makePerspectiveMatrix(Math.PI / 3, 1.0, 0.1, 100.0),
        ]));
    }

    static makePerspectiveMatrix(fovy: number, aspect: number, near: number, far: number): Float32Array {
        const f = 1.0 / Math.tan(fovy * 0.5);
        const nf = 1 / (near - far);
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, (2 * far * near) * nf, 0
        ]);
    }
    static makeViewMatrix(): Float32Array {
        // eye(0,0,4), center(0,0,0), up(0,1,0)
        return new Float32Array([
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,-4,1
        ]);
    }
    static makeModelMatrix(t: number, axis: [number, number, number] = [0, 1, 0]): Float32Array {
        const [x, y, z] = axis;
        const len = Math.sqrt(x * x + y * y + z * z);
        const nx = x / (len || 1);
        const ny = y / (len || 1);
        const nz = z / (len || 1);
        const c = Math.cos(t);
        const s = Math.sin(t);
        const ic = 1 - c;
        // Rodrigues' rotation formula
        return new Float32Array([
            c + nx*nx*ic,     nx*ny*ic - nz*s, nx*nz*ic + ny*s, 0,
            ny*nx*ic + nz*s,  c + ny*ny*ic,    ny*nz*ic - nx*s, 0,
            nz*nx*ic - ny*s,  nz*ny*ic + nx*s, c + nz*nz*ic,    0,
            0,                0,               0,               1
        ]);
    }
}
