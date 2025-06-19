struct Matrices {
    model : mat4x4f,
    view  : mat4x4f,
    proj  : mat4x4f,
};
@group(0) @binding(0) var<uniform> u : Matrices;
@group(1) @binding(0) var texSampler: sampler;
@group(1) @binding(1) var tex: texture_2d<f32>;

struct VertexIn {
    @location(0) position : vec3f,
    @location(1) normal   : vec3f,
    @location(2) tangent  : vec3f,
    @location(3) color    : vec4f,
    @location(4) uv       : vec2f,
};
struct VSOut {
    @builtin(position) pos : vec4f,
    @location(0) color : vec4f,
    @location(1) uv : vec2f,
};
@vertex
fn main_VS(input: VertexIn) -> VSOut {
    var out: VSOut;
    out.pos = u.proj * u.view * u.model * vec4f(input.position, 1.0);
    out.color = input.color;
    out.uv = input.uv;
    return out;
}
@fragment
fn main_FS(input: VSOut) -> @location(0) vec4f {
    let texColor = textureSample(tex, texSampler, input.uv);
    let baseColor = mix(input.color, vec4f(1, 1, 1, 1), 0.8);
    return baseColor * texColor;
}
