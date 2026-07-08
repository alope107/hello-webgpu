struct Uniforms {
    time : f32,
    xShift : f32,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@vertex fn hardcodedTriangles(
    @builtin(vertex_index) vertexIndex : u32,
) -> @builtin(position) vec4f {
    let pos = array(
        vec2f(0.0, -1.0 * sin(uniforms.time)),
        vec2f(-0.5* sin(uniforms.time), -0.5),
        vec2f(0.5, -0.5),

        vec2f(1.0 + uniforms.xShift, 1.0),
        vec2f(.8 + uniforms.xShift, .8),
        vec2f(.6 + uniforms.xShift, .8),
    );
    
    return vec4f(pos[vertexIndex], 0.0, 1.0);
}

@fragment fn gradient(@builtin(position) pos : vec4f) -> @location(0) vec4f {
    return vec4f(pos.x/484.0 * sin(uniforms.time), pos.y/716.0, 1.0, 1.0);
}

// Headache checkerboard
@fragment fn headache(@builtin(position) pos : vec4f) -> @location(0) vec4f {
    return vec4f(sin(pos.x), sin(pos.y), sin(pos.x)*sin(pos.y), 1.0);
}