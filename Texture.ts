
export class Texture {
    public static async create(device: GPUDevice, url: string): Promise<Texture> {
        const bin = await (await fetch(url)).arrayBuffer();
        const blob = new Blob([bin]);
        const imageBitmap = await createImageBitmap(blob);
        const texture = device.createTexture({
            size: [imageBitmap.width, imageBitmap.height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: texture },
            [imageBitmap.width, imageBitmap.height]
        );

        const sampler = device.createSampler();
        const textureBindGroupLayout = device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
            ],
        });
        const textureBindGroup = device.createBindGroup({
            layout: textureBindGroupLayout,
            entries: [
                { binding: 0, resource: sampler },
                { binding: 1, resource: texture.createView() },
            ],
        });

        return new Texture(texture, sampler, textureBindGroupLayout, textureBindGroup);
    }

    private constructor(
        public texture: GPUTexture,
        public sampler: GPUSampler,
        public textureBindGroupLayout: GPUBindGroupLayout,
        public textureBindGroup: GPUBindGroup) { }
}
