async function main() {

    // gets device
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if(!device) {
        console.log("Sucks to suck");
        return;
    }

    // gets shader code
    const response = await fetch("./compute.wgsl");
    if(!response.ok) {
        console.log("lugs to lug");
        return;
    }
    const shaderCode = await response.text();
    console.log(shaderCode);

    
    const module = device.createShaderModule({
        label: 'dublin their mumper all the time',
        code: shaderCode
    });

    const pipeline = device.createComputePipeline({
        label: 'mumper dublin pipline',
        layout: 'auto',
        compute: {
            module,
        },
    });
    
    const input = new Float32Array([22, 3, 67]);

    const workbuffer = device.createBuffer({
        label: 'work buffer',
        size: input.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(workbuffer, 0, input);

    const resultBuffer = device.createBuffer({
        label: 'result buffer',
        size: input.byteLength,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });

    const bindGroup = device.createBindGroup({
        label: 'bindGroup for work buffer',
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: workbuffer }
        ]
    });

    const encoder = device.createCommandEncoder({
        label: 'dublin encoder',
    });
    const pass = encoder.beginComputePass({
        label: 'dublin compute pass',
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(input.length);
    pass.end();

    encoder.copyBufferToBuffer(workbuffer, 0, resultBuffer, 0, resultBuffer.size);

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    await resultBuffer.mapAsync(GPUMapMode.READ);
    const result = new Float32Array(resultBuffer.getMappedRange());

    console.log('input', input);
    console.log('result', result);

    resultBuffer.unmap();
}

main();