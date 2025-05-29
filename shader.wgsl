struct Matrices {
    model : mat4x4f,
    view  : mat4x4f,
    proj  : mat4x4f,
};
@group(0) @binding(0) var<uniform> u : Matrices;
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
};
@vertex
fn main_VS(input: VertexIn) -> VSOut {
    var out: VSOut;
    out.pos = u.proj * u.view * u.model * vec4f(input.position, 1.0);
    out.color = input.color;
    return out;
}
@fragment
fn main_FS(@location(0) color: vec4f) -> @location(0) vec4f {
    return color;
}
