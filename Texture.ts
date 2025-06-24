export class TextureSource {
    
    public static async load(url: string): Promise<TextureSource> {
        const bin = await (await fetch(url)).arrayBuffer();
        const blob = new Blob([bin]);
        const imageBitmap = await createImageBitmap(blob);
        return new TextureSource(imageBitmap);
    }

    private constructor(public bitmap: ImageBitmap){ }
}

export class Texture {

    public readonly texture: GPUTexture;
    public readonly sampler: GPUSampler;
    public readonly textureBindGroupLayout: GPUBindGroupLayout;
    public readonly textureBindGroup: GPUBindGroup;

    public constructor(device: GPUDevice, source: TextureSource)
    {
        this.texture = device.createTexture({
            size: [source.bitmap.width, source.bitmap.height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        device.queue.copyExternalImageToTexture(
            { source: source.bitmap },
            { texture: this.texture },
            [source.bitmap.width, source.bitmap.height]
        );

        this.sampler = device.createSampler();
        this.textureBindGroupLayout = device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
            ],
        });
        this.textureBindGroup = device.createBindGroup({
            layout: this.textureBindGroupLayout,
            entries: [
                { binding: 0, resource: this.sampler },
                { binding: 1, resource: this.texture.createView() },
            ],
        });
    }
}
