@group(0) @binding(0) var<storage, read_write> nums : array<f32>;

@compute @workgroup_size(1) fn scale(@builtin(global_invocation_id) id: vec3u) {
    let i = id.x;
    nums[i] = nums[i]*1.1;
}