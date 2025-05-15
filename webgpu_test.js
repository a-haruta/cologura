window.addEventListener("load", async () =>
{
    if(!navigator.gpu)
    {
        alert("WebGPU に非対応のブラウザ")
        return;
    }
        
    const canvas = document.getElementById("club-cg-header");
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const context = canvas.getContext("webgpu");
    context.configure({
        device: device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        size: [canvas.width, canvas.height],
        alphaMode: "premultiplied",
    });
    console.log(canvas);
    console.log(adapter);
    console.log(device);
    console.log(context);

    // TriangleMeshの作成～アップロード
    const vertexData = new Float32Array([
        ...[0, 1, 0, 1], ...[+0.5 * Math.sqrt(3), -0.5, 0, 1], ...[-0.5 * Math.sqrt(3), -0.5, 0, 1],
    ]);
    const vertexBuffer = device.createBuffer({
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    const vertexLayout = [
        {
            attributes: [ { shaderLocation: 0, offset: 0, format: "float32x4", } ],
            arrayStride: 4 * 4, // sizeof(float32) * 4,
            stepMode: "vertex",
        },
    ];
    device.queue.writeBuffer(vertexBuffer, 0, vertexData.buffer, 0, vertexData.byteLength);

    // パイプラインの作成
    const shaderModule = device.createShaderModule({
        code: `
            struct Uniforms {
                posMatix : mat4x4f,
                rotMatix : mat4x4f,
                scaleMatix : mat4x4f,
                color : vec4f,
            }
            @binding(0) @group(0) var<uniform> uniforms : Uniforms;

            struct VertexOut {
                @builtin(position) position : vec4f,
            }

            @vertex
            fn vs_main(@location(0) position: vec4f) -> VertexOut
            {
                var output : VertexOut;
                output.position = uniforms.posMatix * uniforms.rotMatix * uniforms.scaleMatix * position;
                return output;
            }
            @fragment
            fn fs_main(fragData: VertexOut) -> @location(0) vec4f
            {
                // return vec4f(1.0, 0.0, 0.0, 1.0);
                return uniforms.color;
            }
        `});
    const pipelineDesc = {
        vertex: {
            module: shaderModule,
            entryPoint: "vs_main",
            buffers: vertexLayout,
        },
        fragment: {
            module: shaderModule,
            entryPoint: "fs_main",
            targets: [ { format: navigator.gpu.getPreferredCanvasFormat(), } ],
        },
        primitive: {
            topology: "triangle-list",
        },
        layout: "auto",
    };
    const pipeline = device.createRenderPipeline(pipelineDesc);

    // UniformBuffer
    const uniformData = calcUniformData(0);
    const uniformBuffer = device.createBuffer({
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData.buffer, 0, uniformData.byteLength);
    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer,
                    offset: 0,
                    size: uniformData.byteLength,
                },
            },
        ],
    });

    const startTime = Date.now();
    setInterval(() =>
    {
        const uniformData = calcUniformData(4 * (Date.now() - startTime) / 1000)
        device.queue.writeBuffer(uniformBuffer, 0, uniformData.buffer, 0, uniformData.byteLength);
        
        // コマンド送信
        const commandEncoder = device.createCommandEncoder();
        const renderPassDesc = {
            colorAttachments: [{
                clearValue: { r: 0.3, g: 0.3, b: 0.3, a: 1.0 },
                loadOp: "clear",
                storeOp: "store",
                view: context.getCurrentTexture().createView(),
            }],
        };
        const encoder = commandEncoder.beginRenderPass(renderPassDesc);
        encoder.setPipeline(pipeline);
        encoder.setVertexBuffer(0, vertexBuffer);
        encoder.setBindGroup(0, uniformBindGroup);
        encoder.draw(vertexData.length / 4);
        encoder.end();
        device.queue.submit([commandEncoder.finish()]);
        }, 1000 / 30);
    
        function calcUniformData(t)
        {
            const pos = [0, 0, 0]; // posMatrix
            const scale = 0.9;
            const color = hsvToRgb(t*50, 1, 1);
            const uniformData = new Float32Array([
                1, 0, 0, pos[0], // posMatrix
                0, 1, 0, pos[1],
                0, 0, 1, pos[2],
                0, 0, 0, 1,
                +Math.cos(t), -Math.sin(t), 0, 0, // rotMatrix
                +Math.sin(t), +Math.cos(t), 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
                scale, 0, 0, 0, // scaleMatrix
                0, scale, 0, 0,
                0, 0, scale, 0,
                0, 0, 0, 1,
                color[0], color[1], color[2], 1, // color
            ]);
            return uniformData;
        }
        function hsvToRgb(h, s, v)
        {
            const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
            const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
                      h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
            return [r + m, g + m, b + m];
        }
    });