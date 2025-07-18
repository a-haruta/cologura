import { ObjMeshSource, } from './obj';
import { Mesh, Vertex } from './mesh';
import { Texture, TextureSource } from "./Texture";
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

    const mesh = new Mesh(device, await ObjMeshSource.load('./box.obj'));
    const matrices = new Matrices(device);
    const texture = new Texture(device, await TextureSource.load('./cologra_burger_notm.webp'));

    const shaderModule = device.createShaderModule({ code: await fetch('./shader.wgsl').then(r => r.text()) });
    const pipeline = await device.createRenderPipelineAsync({ // PSO的なやつ
        layout: device.createPipelineLayout({
            bindGroupLayouts: [matrices.bindGroupLayout, texture.textureBindGroupLayout], // ルートシグネチャ的なやつ？
        }),
        vertex: {
            module: shaderModule,
            entryPoint: 'main_VS',
            buffers: [
                {
                    arrayStride: 4 * Vertex.stride,
                    attributes: mesh.attributes,
                },
            ],
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'main_FS',
            targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
        },
        primitive: { topology: 'triangle-list' },
        depthStencil: {
            format: 'depth24plus',
            depthWriteEnabled: true,
            depthCompare: 'less',
        },
    });

    // 深度バッファ用テクスチャを作成
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
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
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        });
        renderPass.setPipeline(pipeline);
        renderPass.setBindGroup(0, matrices.bindGroup);
        renderPass.setBindGroup(1, texture.textureBindGroup);
        renderPass.setVertexBuffer(0, mesh.vertexBuffer);
        renderPass.setIndexBuffer(mesh.indexBuffer, 'uint32');
        renderPass.drawIndexed(mesh.indexCount);
        renderPass.end();
        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(frame);
    }
    frame();
}
