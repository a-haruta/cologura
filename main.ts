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
    const device = (await (await navigator.gpu.requestAdapter())?.requestDevice())!
    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    context.configure({
        device,
        format: navigator.gpu.getPreferredCanvasFormat(),
    });

    let t = 0;
    function frame() {
		t += 1 / 60;
        // ゲーミングな色変化: 時間で色を変える
        const r = (Math.sin(t) + 1) / 2;
        const g = (Math.sin(t + 2) + 1) / 2;
        const b = (Math.sin(t + 4) + 1) / 2;
		const encoder = device.createCommandEncoder();
		const view = context.getCurrentTexture().createView();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view,
                    clearValue: { r, g, b, a: 1 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        });
        renderPass.end();
        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(frame);
    }
    frame();
}