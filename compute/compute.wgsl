@group(0) @binding(0) var<storage, read_write> mumper: array<f32>;

@compute @workgroup_size(1) fn dublin(
    @builtin(global_invocation_id) id: vec3u
) {
    let i = id.x;
    mumper[i] = mumper[i] * 2;
}