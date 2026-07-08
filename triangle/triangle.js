// https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html

async function main() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if(!device) {
        fail('need a browser that supports WebGPU');
        return;
    }

    device.addEventListener('uncapturederror', event => {
        console.error("WebGPU Error:", event.error.message);
    });

    const canvas = document.querySelector('canvas');

    const context = canvas.getContext('webgpu');
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });

    const renderResponse = await fetch("./triangleRender.wgsl");
    if(!renderResponse.ok) {
        fail("Failed to load render shaders");
        return;
    }
    const renderShaderCode = await renderResponse.text();

    const computeResponse = await fetch("./triangleCompute.wgsl");
    if(!computeResponse.ok) {
        fail("Failed to load compute shaders");
        return;
    }
    const computeShaderCode = await computeResponse.text();

    const renderModule = device.createShaderModule({
        label: 'render triangle',
        code: renderShaderCode,
    });

    const computeModule = device.createShaderModule({
        label: 'compute triangle',
        code: computeShaderCode
    });

    const computePipeline = device.createComputePipeline({
        label: 'compute triangle pipeline',
        layout: 'auto',
        compute: {
            module: computeModule
        }
    });

    const renderPipeline = device.createRenderPipeline({
        label: 'render triangle pipline',
        layout: 'auto',
        vertex: { 
            entryPoint: 'hardcodedTriangles',
            module: renderModule,
        },
        fragment: {
            entryPoint: 'gradient',
            module: renderModule,
            targets: [{ format: presentationFormat }],
        },
    });

    const uniformCount = 2;
    const uniformData = new Float32Array(uniformCount);


    const uniformBuffer = device.createBuffer({
        size: 4 * uniformCount, // 4 bytes per float
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const nums = new Float32Array([-.8, .2, .3]);

    const workbuffer = device.createBuffer({
        label: 'work buffer',
        size: nums.byteLength,
        usage: GPUBufferUsage.STORAGE |
            //    GPUBufferUsage.COPY_SRC |
               GPUBufferUsage.COPY_DST |
               GPUBufferUsage.VERTEX,
    });

    const computeBindGroup = device.createBindGroup({
        label: 'bindGroup for array input',
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            {binding: 0, resource: workbuffer}
        ]
    })

    const renderBindGroup = device.createBindGroup({
        label: 'bindGroup for uniform buffer',
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: uniformBuffer },
            { binding: 1, resource: workbuffer }
        ]
    });

    const renderPassDecriptor = {
        label: 'canvas renderPass',
        colorAttachments: [
            {
                // view <- gets filled in in first line of render() (why?)
                clearValue: [.3, .3, .3, 1],
                loadOp: 'clear',
                storeOp: 'store'
            }
        ],
    };

    function render() {
        device.queue.writeBuffer(uniformBuffer, 0, uniformData);
        device.queue.writeBuffer(workbuffer, 0, nums);

        // get the current texture from the canvas context and set it as
        // the texture to render to
        renderPassDecriptor.colorAttachments[0].view = 
            context.getCurrentTexture().createView();

        // command encoder encodes commands [Ed: :|]
        const encoder = device.createCommandEncoder({ label: 'myEncoder'});

        const computePass = encoder.beginComputePass();
        computePass.setPipeline(computePipeline);
        computePass.setBindGroup(0, computeBindGroup);
        computePass.dispatchWorkgroups(nums.length);
        computePass.end();


        // make a render pass encoder to render specific commands
        const renderPass = encoder.beginRenderPass(renderPassDecriptor);
        renderPass.setPipeline(renderPipeline);
        renderPass.setBindGroup(0, renderBindGroup);
        renderPass.draw(6);
        renderPass.end();

        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]); // nothing happens until here - where the commands are all sent to the queue
    }

    // render();

    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            const canvas = entry.target;
            const width = entry.contentBoxSize[0].inlineSize;
            const height = entry.contentBoxSize[0].blockSize;
            canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
            canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
        }

        // render();
    });

    observer.observe(canvas);

    function frame(timestamp) {
        uniformData[0] = timestamp / 1000;
        uniformData[1] += -.001;
        render();

        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

function fail(msg) {
    console.log(msg);
    alert(msg);
}

main();