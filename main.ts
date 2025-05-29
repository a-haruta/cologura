import { float2, float3, float4 } from './math';
import { loadObjMesh, Vertex } from './obj';
import { createWebGPUMeshBuffers } from './mesh';
import { Matrices } from './uniform';

export async function getWebGPUInfo(): Promise<string> {
    const gpu = navigator.gpu;
    const adapter = await gpu.requestAdapter();
    return `
${adapter?.info.device}
${adapter?.info.architecture}
${adapter?.info.vendor}
${adapter?.info.description}
${Array.from(adapter?.features ?? []).join('\n')}
    `;
}

export async function clearCanvasBlue(canvas: HTMLCanvasElement): Promise<void> {
    const device = (await (await navigator.gpu.requestAdapter())?.requestDevice())!;
    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    context.configure({
        device,
        format: navigator.gpu.getPreferredCanvasFormat(),
    });

    const obj = await loadObjMesh('./box.obj');
    const mesh = createWebGPUMeshBuffers(device, obj);

    const matrices = new Matrices(device);

    const shaderWGSL = await fetch('./shader.wgsl').then(r => r.text());
    const pipeline = await device.createRenderPipelineAsync({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [matrices.bindGroupLayout],
        }),
        vertex: {
            module: device.createShaderModule({ code: shaderWGSL }),
            entryPoint: 'main_VS',
            buffers: [
                {
                    arrayStride: 4 * Vertex.stride,
                    attributes: [
                        { shaderLocation: 0, offset: 0,  format: 'float32x3' }, // position
                        { shaderLocation: 1, offset: 12, format: 'float32x3' }, // normal
                        { shaderLocation: 2, offset: 24, format: 'float32x3' }, // tangent
                        { shaderLocation: 3, offset: 36, format: 'float32x4' }, // color
                        { shaderLocation: 4, offset: 52, format: 'float32x2' }, // uv
                    ],
                },
            ],
        },
        fragment: {
            module: device.createShaderModule({ code: shaderWGSL }),
            entryPoint: 'main_FS',
            targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
        },
        primitive: { topology: 'triangle-list' },
        depthStencil: undefined,
    });

    let t = 0;
    function frame() {
        t += 1 / 60;
        // 3つの行列をまとめて書き込む
        matrices.updateMatricesUniformBuffer(device, t);
        const encoder = device.createCommandEncoder();
        const viewGPU = context.getCurrentTexture().createView();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: viewGPU,
                    clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        });
        renderPass.setPipeline(pipeline);
        renderPass.setBindGroup(0, matrices.bindGroup);
        renderPass.setVertexBuffer(0, mesh.vertexBuffer);
        renderPass.setIndexBuffer(mesh.indexBuffer, 'uint32');
        renderPass.drawIndexed(mesh.indexCount);
        renderPass.end();
        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(frame);
    }
    frame();
}
