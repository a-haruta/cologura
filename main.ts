import '@webgpu/types';

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
    const gpu = navigator.gpu;
    const adapter = await gpu.requestAdapter();
    if (!adapter) return;
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    if (!context) return;

    const format = gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format,
    });

    const encoder = device.createCommandEncoder();
    const view = context.getCurrentTexture().createView();
    const renderPass = encoder.beginRenderPass({
        colorAttachments: [
            {
                view,
                clearValue: { r: 0, g: 0, b: 1, a: 1 }, // 青でクリア
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
    });
    renderPass.end();
    device.queue.submit([encoder.finish()]);
}